/**
 * Los sonidos de los juegos: grabaciones de Kenney (kenney.nl, CC0, dominio público), pasadas a mp3
 * mono y chicas para que anden en todos los teléfonos (el iPhone no lee los .ogg originales).
 *
 *   node scripts/sonidos.mjs <carpeta con los zips de Kenney descomprimidos> <ffmpeg.exe>
 *   → public/sonidos/*.mp3
 *
 * Los packs: Impact Sounds, Interface Sounds y Casino Audio. Se bajan gratis de kenney.nl.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join, basename } from "node:path";

const [origen, ffmpeg] = process.argv.slice(2);
if (!origen || !ffmpeg) throw new Error("Uso: node scripts/sonidos.mjs <carpeta kenney> <ffmpeg>");
const OUT = resolve(import.meta.dirname, "..", "public", "sonidos");
mkdirSync(OUT, { recursive: true });

/** El nombre en el juego → el archivo de Kenney. Los nombres son los de `Sonido` en Shell.tsx. */
const ELEGIDOS = {
  clic: "click_002",
  elegir: "select_001",
  acierto: "confirmation_001",
  logro: "confirmation_004",
  error: "error_006",
  tic: "tick_002",
  pop: "drop_002",
  carta: "card-place-1",
  barajar: "card-shuffle",
  monedas: "chips-stack-1",
  ficha: "chip-lay-1",
  dado: "dice-throw-1",
  vidrio: "impactGlass_light_000",
  brindis: "glass_002",
  "vidrio-roto": "impactGlass_heavy_002",
  bola: "impactPlate_light_001",
  banda: "impactSoft_medium_000",
  tronera: "impactWood_light_002",
  madera: "impactWood_light_000",
  golpe: "impactSoft_heavy_001",
  paleta: "impactPlank_medium_000",
  campana: "impactBell_heavy_000",
  glitch: "glitch_001",
  pagina: "card-slide-1",
};

const todos = new Map();
const recorrer = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith(".ogg")) todos.set(basename(f, ".ogg"), p);
  }
};
recorrer(origen);

for (const [nombre, archivo] of Object.entries(ELEGIDOS)) {
  const src = todos.get(archivo);
  if (!src) {
    console.log("falta", archivo);
    continue;
  }
  const dst = resolve(OUT, `${nombre}.mp3`);
  if (existsSync(dst)) continue;
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "44100", "-b:a", "80k", dst]);
  console.log("listo", nombre);
}
