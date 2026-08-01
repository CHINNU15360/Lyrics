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
    const searchUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`;
    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();

    if (searchData && searchData.success && searchData.data && searchData.data.results.length > 0) {
      const track = searchData.data.results[0];
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
    console.error("Audio query error:", err);
  }

  return res.status(502).json({ error: "Track not found online." });
};
