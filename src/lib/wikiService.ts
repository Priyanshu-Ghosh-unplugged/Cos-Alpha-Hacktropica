// Wikipedia Search Service - Fetch and display Wikipedia summaries

export interface WikiResult {
  title: string;
  extract: string;
  pageUrl: string;
  thumbnail?: string;
  description?: string;
}

export async function searchWikipedia(query: string): Promise<WikiResult | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.extract) {
        return {
          title: data.title,
          extract: data.extract,
          pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
          thumbnail: data.thumbnail?.source,
          description: data.description,
        };
      }
    }

    // Fallback: search API
    const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
    const fallbackResp = await fetch(fallbackUrl);
    if (!fallbackResp.ok) return null;
    
    const fallbackData = await fallbackResp.json();
    const results = fallbackData.query?.search;
    if (!results || results.length === 0) return null;

    const title = results[0].title;
    // Fetch summary for found title
    const summaryResp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryResp.ok) return null;

    const summaryData = await summaryResp.json();
    return {
      title: summaryData.title,
      extract: summaryData.extract || results[0].snippet.replace(/<[^>]+>/g, ''),
      pageUrl: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      thumbnail: summaryData.thumbnail?.source,
      description: summaryData.description,
    };
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return null;
  }
}

export function formatWikiResult(result: WikiResult): string {
  const divider = '─'.repeat(60);
  const lines: string[] = [
    divider,
    `📖 ${result.title}`,
    result.description ? `   ${result.description}` : '',
    divider,
    '',
    wordWrap(result.extract, 60),
    '',
    divider,
    `🔗 ${result.pageUrl}`,
    divider,
  ];
  return lines.filter(l => l !== undefined).join('\n');
}

function wordWrap(text: string, maxWidth: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.join('\n');
}
