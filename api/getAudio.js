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
    // Call Cobalt's open API processing endpoint
    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        downloadMode: "audio",
        audioFormat: "mp3"
      })
    });

    const data = await response.json();

    if (data && data.url) {
      return res.status(200).json({
        audioUrl: data.url
      });
    }
  } catch (err) {
    console.error("Cobalt proxy error:", err);
  }

  return res.status(502).json({ error: "Failed to resolve stream link." });
};
