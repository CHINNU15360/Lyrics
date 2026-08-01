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

  // Failover array of open-source Piped instances
  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.syncpundit.io",
    "https://piped-api.garudalinux.org"
  ];

  for (const base of instances) {
    try {
      // 1. Search for the song
      const searchResp = await fetch(`${base}/search?q=${encodeURIComponent(query + " audio")}&filter=all`);
      if (!searchResp.ok) continue;
      const searchData = await searchResp.json();
      
      const video = searchData.items.find(i => i.type === 'stream');
      if (!video) continue;
      
      const videoId = video.url.split('?v=')[1];

      // 2. Extract the unblocked Google Video stream URL
      const streamResp = await fetch(`${base}/streams/${videoId}`);
      if (!streamResp.ok) continue;
      const streamData = await streamResp.json();

      if (streamData.audioStreams && streamData.audioStreams.length > 0) {
        // Find the highest bitrate audio format
        const bestAudio = streamData.audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];
        
        return res.status(200).json({
          audioUrl: bestAudio.url,
          title: video.title,
          artist: video.uploaderName
        });
      }
    } catch (err) {
      console.error(`Failed on instance ${base}`);
    }
  }

  return res.status(502).json({ error: "Could not extract direct stream." });
};
