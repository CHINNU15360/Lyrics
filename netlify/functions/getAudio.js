exports.handler = async function (event) {
  const query = event.queryStringParameters ? event.queryStringParameters.q : null;

  if (!query) {
    return {
      statusCode: 400,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Missing query parameter" })
    };
  }

  // List of public Invidious instances to loop through for reliability
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

      // Get video details for direct audio stream URL
      const videoUrl = `${instance}/api/v1/videos/${videoId}`;
      const videoResp = await fetch(videoUrl);

      if (!videoResp.ok) continue;

      const videoData = await videoResp.json();
      const adaptiveFormats = videoData.adaptiveFormats || [];

      // Find the best quality audio stream
      const audioStream = adaptiveFormats
        .filter(f => f.type && f.type.startsWith("audio/"))
        .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))[0];

      if (audioStream && audioStream.url) {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: title,
            artist: author,
            audioUrl: audioStream.url
          })
        };
      }
    } catch (err) {
      console.log(`Failed on instance ${instance}:`, err.message);
    }
  }

  return {
    statusCode: 502,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: "All stream proxies are currently busy. Try local MP3!" })
  };
};
