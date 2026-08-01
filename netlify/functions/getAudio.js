exports.handler = async function (event) {
  const query = event.queryStringParameters ? event.queryStringParameters.q : null;

  if (!query) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Missing query parameter" })
    };
  }

  try {
    const targetUrl = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=1`;
    
    // Uses global native fetch with HTTPS fallback
    const response = await fetch(targetUrl);
    const data = await response.json();

    if (data && data.success && data.data && data.data.results && data.data.results.length > 0) {
      const song = data.data.results[0];
      const downloadUrls = song.downloadUrl;

      if (downloadUrls && downloadUrls.length > 0) {
        const streamUrl = downloadUrls[downloadUrls.length - 1].url;

        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: song.name || query,
            artist: (song.artists && song.artists.primary && song.artists.primary[0]) ? song.artists.primary[0].name : "Online Artist",
            audioUrl: streamUrl
          })
        };
      }
    }

    return {
      statusCode: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Song stream not found" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Server error: " + error.message })
    };
  }
};
