// Latest writing, pulled from the portfolio's sitemap. The site is a separate
// deploy, so every failure here degrades to an empty list: the card still renders.
const SITE = 'https://karenrebecaortiz.com';
// The site ships every article twice, /articulos and /en/articulos. The card
// reads in English, so it follows the /en variant.
const PREFIX = '/en/articulos/';
const TIMEOUT = 8000;

async function get(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { 'user-agent': 'karenrebecag-terminal-card' },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function relative(iso, now) {
  const days = Math.floor((now - new Date(iso)) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

export async function latestWriting({ count = 3, now = new Date() } = {}) {
  try {
    const xml = await get(`${SITE}/sitemap.xml`);
    const entries = new Map();
    for (const block of xml.split('<url>').slice(1)) {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1];
      const mod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
      if (!loc || !mod || !loc.includes(PREFIX)) continue;
      const slug = loc.replace(/\/$/, '').split('/').pop();
      if (!entries.has(slug)) entries.set(slug, { url: loc.replace(/\/$/, ''), mod });
    }

    const recent = [...entries.values()]
      .sort((a, b) => new Date(b.mod) - new Date(a.mod))
      .slice(0, count);

    const titled = await Promise.all(recent.map(async ({ url, mod }) => {
      try {
        const html = await get(url);
        const title = html.match(/<meta property="og:title" content="(.*?)"/)?.[1];
        // og:title carries "Title | Subtitle" on some posts; the card wants the title.
        return title ? { title: decode(title).split(' | ')[0], when: relative(mod, now) } : null;
      } catch {
        return null;
      }
    }));

    return titled.filter(Boolean);
  } catch (err) {
    console.warn(`writing feed unavailable: ${err.message}`);
    return [];
  }
}
