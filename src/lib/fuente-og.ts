/**
 * La tipografía de la casa para las imágenes que se arman en el servidor (afiches, historias),
 * pedida a Google con solo los caracteres que aparecen. Si falla, null: la imagen sale igual con serif.
 */
export async function loadFont(family: string, text: string, weight = 400): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } },
    ).then((r) => r.text());
    // Satori no lee woff2: se pide el formato que sí entiende.
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}
