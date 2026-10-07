/**
 * Los emojis de los juegos, en 3D (Fluent Emoji de Microsoft, licencia MIT).
 *
 *   node scripts/emojis-3d.mjs   → public/emoji/*.webp + src/lib/emoji-3d.json
 *
 * Los juegos usaban los emojis del sistema, y cada teléfono los dibuja distinto: en Windows y en
 * muchos Android salen chatos y chicos. Esto busca todos los emojis que aparecen en el código de los
 * juegos, baja su versión 3D y la deja servida desde el propio sitio (sin depender de otro servidor
 * en la noche). Si un emoji no tiene versión 3D, el juego sigue mostrando el del sistema.
 *
 * Correrlo de nuevo cuando un juego sume emojis: baja sólo los que faltan.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");
const datos = Object.values(require("fluentui-emoji-js/emojiData.json"));
const OUT = resolve(root, "public", "emoji");
const MANIFIESTO = resolve(root, "src", "lib", "emoji-3d.json");
const TAM = 160;
mkdirSync(OUT, { recursive: true });

const DONDE = ["src/components/jugar", "src/lib/juegos.ts", "src/lib/juegos-reglas.ts", "src/lib/jugar.ts", "src/lib/impostor.ts", "src/lib/juegos-carta.ts", "src/app/hoy"];
const archivos = [];
const juntar = (p) => {
  const abs = resolve(root, p);
  if (!existsSync(abs)) return;
  if (statSync(abs).isDirectory()) for (const f of readdirSync(abs)) juntar(join(p, f));
  else if (/\.(tsx?|json)$/u.test(p)) archivos.push(abs);
};
DONDE.forEach(juntar);

const RE = /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])?(?:‍\p{Extended_Pictographic}(?:️)?)*/gu;
const sinVariante = (s) => s.replace(/️/gu, "");
const encontrados = new Set();
for (const a of archivos) for (const m of readFileSync(a, "utf8").matchAll(RE)) encontrados.add(sinVariante(m[0]));

const porGlifo = new Map(datos.filter((d) => d.images?.["3D"]?.length).map((d) => [sinVariante(d.glyph), d]));
const manifiesto = existsSync(MANIFIESTO) ? JSON.parse(readFileSync(MANIFIESTO, "utf8")) : {};
const sinVersion = [];

for (const e of [...encontrados].sort()) {
  const d = porGlifo.get(e);
  if (!d) {
    sinVersion.push(e);
    continue;
  }
  const nombre = [...e].map((c) => c.codePointAt(0).toString(16)).join("-");
  const destino = resolve(OUT, `${nombre}.webp`);
  manifiesto[e] = nombre;
  if (existsSync(destino)) continue;
  const url = `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets${encodeURI(d.folder)}/3D/${encodeURIComponent(d.images["3D"][0])}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log("no se pudo bajar", e, res.status, url);
    delete manifiesto[e];
    continue;
  }
  await sharp(Buffer.from(await res.arrayBuffer())).resize(TAM, TAM, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 }).toFile(destino);
  console.log("bajado", e, nombre);
}

const ordenado = Object.fromEntries(Object.entries(manifiesto).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFIESTO, JSON.stringify(ordenado, null, 2) + "\n");
console.log(`${Object.keys(ordenado).length} emojis en 3D · sin versión 3D: ${sinVersion.join(" ") || "ninguno"}`);
