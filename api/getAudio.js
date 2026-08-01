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
    // Fast search for the YouTube Video ID
    const searchUrl = `https://inv.projectsegfau.lt/api/v1/search?q=${encodeURIComponent(query + " audio")}&type=video`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return res.status(200).json({
        videoId: data[0].videoId,
        title: data[0].title,
        artist: data[0].author
      });
    }
  } catch (err) {
    console.error("Search error:", err);
  }

  return res.status(502).json({ error: "Video ID lookup failed." });
};
