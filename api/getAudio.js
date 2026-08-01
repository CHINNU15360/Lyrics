module.exports = async (req, res) => {
  // CORS Headers
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
    const searchUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`;
    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();

    if (searchData && searchData.success && searchData.data && searchData.data.results.length > 0) {
      const track = searchData.data.results[0];
      const downloadObj = track.downloadUrl ? (track.downloadUrl.find(d => d.quality === "320kbps") || track.downloadUrl[track.downloadUrl.length - 1]) : null;

      if (downloadObj && downloadObj.url) {
        if (req.query.mode === 'info') {
          return res.status(200).json({
            title: track.name || query,
            artist: track.primaryArtists || "Online Stream"
          });
        }

        const audioResp = await fetch(downloadObj.url);
        const arrayBuffer = await audioResp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        return res.status(200).send(buffer);
      }
    }
  } catch (err) {
    console.error("Audio proxy error:", err);
  }

  return res.status(502).json({ error: "Failed to fetch online song." });
};
