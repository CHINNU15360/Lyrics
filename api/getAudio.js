module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    // Step 1: Resolve song name into a YouTube Video URL
    const searchUrl = `https://inv.projectsegfau.lt/api/v1/search?q=${encodeURIComponent(query + " audio")}&type=video`;
    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();

    if (!Array.isArray(searchData) || searchData.length === 0) {
      return res.status(404).json({ error: "Song not found" });
    }

    const videoId = searchData[0].videoId;
    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 2: Send the exact YouTube URL to Cobalt API
    const cobaltResp = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: targetUrl,
        downloadMode: "audio",
        audioFormat: "mp3"
      })
    });

    const cobaltData = await cobaltResp.json();

    if (cobaltData && cobaltData.url) {
      return res.status(200).json({
        audioUrl: cobaltData.url,
        title: searchData[0].title
      });
    }
  } catch (err) {
    console.error("Cobalt extraction error:", err);
  }

  return res.status(502).json({ error: "Stream extraction failed. Try local MP3!" });
};
