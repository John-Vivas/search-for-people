// Vercel serverless: extrae la foto de portada (og:image) de un post PÚBLICO
// de Instagram, Facebook o TikTok. Se ejecuta en el servidor (sin CORS ni
// login del usuario). Devuelve { image, title } o un error claro.
//
// Nota: solo funciona con publicaciones públicas. Si es privada o la red
// bloquea el acceso, devuelve 422 y la UI pide subir la foto (plan B).

const ALLOWED_HOST = /(^|\.)(instagram\.com|facebook\.com|fb\.watch|fb\.com|tiktok\.com)$/i;

export default async function handler(req, res) {
  const url = (req.query?.url || '').toString().trim();
  if (!url) {
    return res.status(400).json({ error: 'Falta el parámetro url.' });
  }

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return res.status(400).json({ error: 'La URL no es válida.' });
  }

  if (!ALLOWED_HOST.test(host)) {
    return res
      .status(400)
      .json({ error: 'Solo se permiten enlaces de Instagram, Facebook o TikTok.' });
  }

  try {
    // TikTok: su oEmbed entrega el thumbnail de forma confiable.
    if (/tiktok\.com/i.test(host)) {
      const oembed = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      );
      if (oembed.ok) {
        const data = await oembed.json();
        if (data?.thumbnail_url) {
          return res
            .status(200)
            .json({ image: data.thumbnail_url, title: data.title || null });
        }
      }
    }

    // IG/FB (y fallback de TikTok): leer og:image del HTML público.
    const page = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AlertavivoBot/1.0; +https://www.alertavivo.co)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    const html = await page.text();
    const image = matchMeta(html, 'og:image') || matchMeta(html, 'twitter:image');
    const title = matchMeta(html, 'og:title');

    if (!image) {
      return res.status(422).json({
        error:
          'No pudimos leer la imagen del enlace. ¿La publicación es pública? Si no, subí la foto.',
      });
    }

    return res.status(200).json({ image, title: title || null });
  } catch {
    return res
      .status(502)
      .json({ error: 'No se pudo procesar el enlace. Probá subir la foto.' });
  }
}

/** Extrae el content de un <meta property|name="prop"> en cualquier orden. */
function matchMeta(html, prop) {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
    'i'
  );
  const m = html.match(re1) || html.match(re2);
  return m ? decodeEntities(m[1]) : null;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x2F;/gi, '/');
}
