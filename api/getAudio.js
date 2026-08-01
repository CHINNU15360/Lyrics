module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    // Query JioSaavn primary public API for high-bitrate direct MP3 link
    const searchUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data && data.success && data.data && data.data.results && data.data.results.length > 0) {
      const track = data.data.results[0];
      
      // Get highest quality download URL (320kbps or 160kbps)
      const downloadObj = track.downloadUrl ? (track.downloadUrl.find(d => d.quality === "320kbps") || track.downloadUrl[track.downloadUrl.length - 1]) : null;

      if (downloadObj && downloadObj.url) {
        return res.status(200).json({
          title: track.name || query,
          artist: track.primaryArtists || "Online Stream",
          audioUrl: downloadObj.url
        });
      }
    }
  } catch (err) {
    console.error("Primary stream failed:", err);
  }

  return res.status(502).json({ error: "Stream unavailable. Use local MP3!" });
};
