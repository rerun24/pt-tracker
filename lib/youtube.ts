interface YouTubeSearchResult {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 3
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YouTube API key not configured');
    return [];
  }

  try {
    const searchQuery = encodeURIComponent(`${query} physical therapy exercise`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=${maxResults}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('YouTube API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.items.map((item: {
      id: { videoId: string };
      snippet: { title: string; thumbnails: { high: { url: string } } };
    }) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}
