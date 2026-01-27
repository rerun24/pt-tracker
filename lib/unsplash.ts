interface UnsplashSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export async function searchUnsplashImages(
  query: string,
  perPage: number = 3
): Promise<UnsplashSearchResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.error('Unsplash access key not configured');
    return [];
  }

  try {
    const searchQuery = encodeURIComponent(`${query} exercise fitness`);
    const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.results.map((item: {
      id: string;
      alt_description: string | null;
      urls: { regular: string; thumb: string };
    }) => ({
      id: item.id,
      title: item.alt_description || query,
      url: item.urls.regular,
      thumbnailUrl: item.urls.thumb,
    }));
  } catch (error) {
    console.error('Unsplash search error:', error);
    return [];
  }
}
