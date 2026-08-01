export default async function handler(req, res) {
  const query = req.query.q;

  // Enable CORS so your app can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  // Public Invidious instances failover loop
  const instances = [
    "https://inv.projectsegfau.lt",
    "https://invidious.drgns.space",
    "https://invidious.nerdvpn.de",
    "https://invidious.flokinet.to"
  ];

  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query + " audio")}&type=video`;
      const response = await fetch(searchUrl);

      if (!response.ok) continue;

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) continue;

      const videoId = results[0].videoId;
      const title = results[0].title;
      const author = results[0].author;

      const videoUrl = `${instance}/api/v1/videos/${videoId}`;
      const videoResp = await fetch(videoUrl);

      if (!videoResp.ok) continue;

      const videoData = await videoResp.json();
      const adaptiveFormats = videoData.adaptiveFormats || [];

      // Find the highest quality audio stream
      const audioStream = adaptiveFormats
        .filter(f => f.type && f.type.startsWith("audio/"))
        .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))[0];

      if (audioStream && audioStream.url) {
        return res.status(200).json({
          title: title,
          artist: author,
          audioUrl: audioStream.url
        });
      }
    } catch (err) {
      console.log(`Failed on instance ${instance}:`, err.message);
    }
  }

  return res.status(502).json({ error: "All stream proxies are currently busy. Try local MP3!" });
}
