/**
 * Los retratos de la novela hechos con IA: les saca el fondo verde y los deja livianos para el celu.
 *
 *   node scripts/retratos.mjs <carpeta con los png>   → public/novela/*.webp
 *
 * Los archivos se llaman personaje-expresion.png (vera-picara.png). El fondo tiene que ser verde
 * liso (#00FF00), como pide informe/novela-prompts.md: el verde se vuelve transparente y el borde
 * verdoso que queda alrededor del pelo se neutraliza.
 */
import { readdirSync, mkdirSync } from "node:fs";
import { resolve, join, basename, extname } from "node:path";
import sharp from "sharp";

const origen = process.argv[2];
if (!origen) throw new Error("Uso: node scripts/retratos.mjs <carpeta>");
const OUT = resolve(import.meta.dirname, "..", "public", "novela");
mkdirSync(OUT, { recursive: true });
const ALTO = 900;

for (const f of readdirSync(origen)) {
  if (!/\.(png|jpe?g|webp)$/iu.test(f)) continue;
  const nombre = basename(f, extname(f)).toLowerCase();
  const { data, info } = await sharp(join(origen, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const verde = g - Math.max(r, b);
    if (verde > 90) data[i + 3] = 0;
    else if (verde > 25) {
      // Borde: medio transparente y sin el tinte verde.
      data[i + 3] = Math.round(255 * (1 - (verde - 25) / 65));
      data[i + 1] = Math.max(r, b);
    }
  }
  await sharp(data, { raw: info })
    .trim()
    .resize({ height: ALTO, withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 90 })
    .toFile(resolve(OUT, `${nombre}.webp`));
  console.log("listo", nombre);
}
