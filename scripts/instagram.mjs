/**
 * Las piezas de Instagram que no cambian todas las semanas: las tapas de las historias destacadas,
 * el posteo de eventos (feed y estado) y bocetos de logo.
 *
 *   node scripts/instagram.mjs   → informe/instagram/*.png
 *
 * Todo es tipográfico y de un solo color sobre fondo liso: se lee chico (una tapa de destacada mide
 * menos que una uña en el teléfono) y el logo funciona igual impreso en blanco y negro.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const OUT = resolve(root, "informe", "instagram");
mkdirSync(OUT, { recursive: true });

const FONDO = "#141210";
const ORO = "#d8b878";
const CREMA = "#f3ece1";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Arial, sans-serif";

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function png(nombre, svg) {
  await sharp(Buffer.from(svg)).png().toFile(resolve(OUT, nombre));
  console.log("escrito:", nombre);
}

// ---------- tapas de destacadas: 1080×1080, un ícono grande y nada más ----------
// La primera versión traía la palabra adentro de un aro, e Instagram la achicaba dentro de su propio
// círculo hasta que no se leía. El nombre ya va abajo de cada destacada: la tapa solo tiene que
// reconocerse de un vistazo, así que va el dibujo solo, grande y en dorado.
const tapa = (icono) => `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  <rect width="1080" height="1080" fill="${FONDO}"/>
  <g fill="none" stroke="${ORO}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">${icono}</g>
</svg>`;

const ICONOS = {
  // Una copa de cóctel con su aceituna.
  carta: `<path d="M330 330 H750 L540 590 Z"/><path d="M540 590 V770"/><path d="M430 770 H650"/><circle cx="610" cy="400" r="30" fill="${ORO}" stroke="none"/>`,
  // La estrella de cuatro puntas, la misma que adorna el sitio.
  eventos: `<path d="M540 290 Q562 518 790 540 Q562 562 540 790 Q518 562 290 540 Q518 518 540 290 Z" fill="${ORO}" stroke="none"/>`,
  // La bola ocho.
  mesa: `<circle cx="540" cy="540" r="230" fill="${ORO}" stroke="none"/><circle cx="540" cy="540" r="105" fill="${FONDO}" stroke="none"/><text x="540" y="590" text-anchor="middle" font-family="${SERIF}" font-size="150" fill="${ORO}" stroke="none">8</text>`,
  // La luna: el lunes.
  lunes: `<circle cx="540" cy="540" r="240" fill="${ORO}" stroke="none"/><circle cx="625" cy="470" r="215" fill="${FONDO}" stroke="none"/>`,
  // El pin del mapa.
  llegar: `<path d="M540 800 C430 650 360 560 360 455 A180 180 0 1 1 720 455 C720 560 650 650 540 800 Z"/><circle cx="540" cy="455" r="62"/>`,
};

const tapas = [
  ["destacada-carta.png", ICONOS.carta],
  ["destacada-eventos.png", ICONOS.eventos],
  ["destacada-mesa.png", ICONOS.mesa],
  ["destacada-lunes.png", ICONOS.lunes],
  ["destacada-llegar.png", ICONOS.llegar],
];
for (const [archivo, icono] of tapas) await png(archivo, tapa(icono));

// ---------- posteo de eventos ----------
// Sin precios a propósito: la casa los pasa por mensaje, y un posteo que lo dice todo no deja nada que preguntar.
const evento = (w, h) => {
  const cx = w / 2;
  const u = h / 1350;
  const y = (n) => Math.round(n * u);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${FONDO}"/>
  <rect x="${y(36)}" y="${y(36)}" width="${w - y(72)}" height="${h - y(72)}" fill="none" stroke="${ORO}" stroke-opacity=".35" stroke-width="2"/>
  <text x="${cx}" y="${y(190)}" text-anchor="middle" font-family="${SANS}" font-size="${y(30)}" letter-spacing="${y(9)}" fill="${ORO}">CATDOG · LA PLATA</text>
  <text x="${cx}" y="${y(420)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(118)}" fill="${CREMA}">Tu cumpleaños,</text>
  <text x="${cx}" y="${y(560)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(118)}" fill="${CREMA}">en la casa</text>
  <line x1="${cx - y(90)}" y1="${y(640)}" x2="${cx + y(90)}" y2="${y(640)}" stroke="${ORO}" stroke-width="3"/>
  <text x="${cx}" y="${y(760)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(50)}" fill="${CREMA}">Cerramos la casa para tu grupo.</text>
  <text x="${cx}" y="${y(840)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(50)}" fill="${CREMA}">Tapeo o sánguches, la barra andando</text>
  <text x="${cx}" y="${y(920)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(50)}" fill="${CREMA}">y el lugar entero para ustedes.</text>
  <text x="${cx}" y="${y(1040)}" text-anchor="middle" font-family="${SANS}" font-size="${y(36)}" letter-spacing="${y(5)}" fill="${ORO}">DE 5 A 25 PERSONAS</text>
  <text x="${cx}" y="${y(1180)}" text-anchor="middle" font-family="${SERIF}" font-size="${y(46)}" fill="${CREMA}">Escribinos y te pasamos el presupuesto</text>
  <text x="${cx}" y="${y(1245)}" text-anchor="middle" font-family="${SANS}" font-size="${y(30)}" letter-spacing="${y(3)}" fill="${ORO}">LA FECHA SE TOMA CON LA SEÑA</text>
</svg>`;
};
await png("post-eventos-feed.png", evento(1080, 1350));

// El estado es más alto: mismo contenido, con aire arriba y abajo para los botones de Instagram.
const eventoEstado = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  <rect width="1080" height="1920" fill="${FONDO}"/>
  <svg x="0" y="285" width="1080" height="1350">${evento(1080, 1350).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>
</svg>`;
await png("post-eventos-estado.png", eventoEstado);

// ---------- bocetos de logo: de un solo color, para que sirvan en el perfil y en blanco y negro ----------
const conceptos = (fondo, tinta, acento) => `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="700">
  <rect width="1800" height="700" fill="${fondo}"/>

  <!-- A. La palabra sola, espaciada, con una línea de bajada -->
  <g transform="translate(300 330)">
    <text x="0" y="0" text-anchor="middle" font-family="${SERIF}" font-size="84" letter-spacing="22" fill="${tinta}">CATDOG</text>
    <line x1="-60" y1="44" x2="60" y2="44" stroke="${acento}" stroke-width="3"/>
    <text x="0" y="100" text-anchor="middle" font-family="${SANS}" font-size="24" letter-spacing="8" fill="${tinta}">LA CASA · LA PLATA</text>
  </g>

  <!-- B. Monograma para el perfil: se lee aunque mida un centímetro -->
  <g transform="translate(900 330)">
    <circle r="190" fill="none" stroke="${acento}" stroke-width="5"/>
    <circle r="168" fill="none" stroke="${acento}" stroke-width="1.5"/>
    <text x="0" y="52" text-anchor="middle" font-family="${SERIF}" font-size="190" fill="${tinta}">CD</text>
    <text x="0" y="120" text-anchor="middle" font-family="${SANS}" font-size="20" letter-spacing="7" fill="${tinta}">LA PLATA</text>
  </g>

  <!-- C. La puerta: la casa sin cartel -->
  <g transform="translate(1500 330)">
    <path d="M -90 150 L -90 -60 A 90 90 0 0 1 90 -60 L 90 150" fill="none" stroke="${acento}" stroke-width="6"/>
    <circle cx="52" cy="50" r="9" fill="${acento}"/>
    <text x="0" y="230" text-anchor="middle" font-family="${SERIF}" font-size="60" letter-spacing="14" fill="${tinta}">CATDOG</text>
  </g>

  <text x="300" y="640" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${tinta}" opacity=".6">A · la palabra</text>
  <text x="900" y="640" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${tinta}" opacity=".6">B · monograma</text>
  <text x="1500" y="640" text-anchor="middle" font-family="${SANS}" font-size="26" fill="${tinta}" opacity=".6">C · la puerta</text>
</svg>`;
await png("logo-bocetos-oscuro.png", conceptos(FONDO, CREMA, ORO));
await png("logo-bocetos-blanco-y-negro.png", conceptos("#ffffff", "#000000", "#000000"));

// El monograma a tamaño de foto de perfil, para probar cómo se ve en el círculo de Instagram.
await png(
  "logo-perfil-monograma.png",
  `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
  <rect width="1080" height="1080" fill="${FONDO}"/>
  <circle cx="540" cy="540" r="400" fill="none" stroke="${ORO}" stroke-width="10"/>
  <circle cx="540" cy="540" r="362" fill="none" stroke="${ORO}" stroke-width="3"/>
  <text x="540" y="650" text-anchor="middle" font-family="${SERIF}" font-size="400" fill="${CREMA}">CD</text>
</svg>`,
);
