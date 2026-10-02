/**
 * La carta para imprimir (A4, blanco y negro, para plastificar).
 *
 *   node scripts/carta-imprimir.mjs        → informe/catdog-carta.html
 *   node scripts/carta-imprimir.mjs --pdf  → también el PDF (necesita Chrome o Edge)
 *
 * Sale de los mismos datos que cobra la caja, no de una copia a mano: la de antes era un HTML
 * suelto y por eso quedó con la mesa a $6.000 y los tragos a $7.000 cuando ya no era así.
 *
 * Lo que lee:
 *  - Setting caja:productos      → lo suelto (cerveza, agua, sánguche…) y su precio
 *  - Setting caja:tarifa_hora    → la mesa
 *  - Setting barra:opciones      → los combos, con su descripción si la tienen
 *  - Setting barra:incluye       → la bajada del sánguche
 *  - Setting barra:horario       → el encabezado (los días no van: la carta está en la mesa, ya se sabe que abrió)
 *  - scripts/carta-tragos.json   → los tragos, con sus descripciones y sus precios por sección
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import QRCode from "qrcode";

const root = resolve(import.meta.dirname, "..");
const url = readFileSync(resolve(root, ".env.local"), "utf8").match(/^DATABASE_URL="?([^"\n\r]+)/m)[1];

const CLAVES = ["caja:productos", "caja:tarifa_hora", "barra:opciones", "barra:incluye", "barra:dias", "barra:horario"];

/** "Nombre | precio | descripción" por línea. La descripción es opcional. */
function parseLineas(raw) {
  return (raw ?? "")
    .split("\n")
    .map((l) => {
      const [nombre, precio, desc] = l.split("|");
      return { nombre: (nombre ?? "").trim(), precio: Number((precio ?? "").replace(/\D/gu, "")), desc: (desc ?? "").trim() };
    })
    .filter((x) => x.nombre && x.precio > 0);
}

const precio = (n) => "$" + new Intl.NumberFormat("es-AR").format(n);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Un renglón: nombre, puntos, precio, y la nota abajo si la hay. */
function fila({ nombre, precio: p, desc }, precioComun) {
  // Si toda la sección vale lo mismo, el precio ya está en el título: repetirlo veinte veces no
  // informa nada y le saca aire a la columna. Sólo se escribe el que se sale del precio común.
  const n = p && p !== precioComun ? p : precioComun ? 0 : p;
  return (
    `<li><div class="fila"><span class="n">${esc(nombre)}</span>${n ? '<span class="r"></span>' : ""}` +
    (n ? `<span class="p">${precio(n)}</span>` : "") +
    `</div>${desc ? `<p class="nota">${esc(desc)}</p>` : ""}</li>`
  );
}

function seccion(titulo, items, { bajada = "", precioComun = null, columnas = false } = {}) {
  if (items.length === 0) return "";
  const lista = `<ul>${items.map((i) => fila(i, precioComun)).join("")}</ul>`;
  const cuerpo = columnas ? partirEnDos(items, precioComun) : lista;
  return (
    `    <section>\n      <h2>${esc(titulo)}${precioComun ? ` · ${precio(precioComun)}` : ""}</h2>\n` +
    (bajada ? `      <p class="bajada">${esc(bajada)}</p>\n` : "") +
    `      ${cuerpo}\n    </section>\n`
  );
}

/** Una lista larga partida en dos columnas, para que entre en la hoja. */
function partirEnDos(items, precioComun) {
  const mitad = Math.ceil(items.length / 2);
  const col = (xs) => `<ul>${xs.map((i) => fila(i, precioComun)).join("")}</ul>`;
  return `<div class="cols">${col(items.slice(0, mitad))}${col(items.slice(mitad))}</div>`;
}

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();
const { rows } = await cliente.query("SELECT key, value FROM \"Setting\" WHERE key = ANY($1)", [CLAVES]);
await cliente.end();
const v = (k) => rows.find((r) => r.key === k)?.value?.trim() ?? "";

const productos = parseLineas(v("caja:productos"));
const opciones = parseLineas(v("barra:opciones"));
const tarifaHora = Number(v("caja:tarifa_hora").replace(/\D/gu, "")) || 0;
const tragos = JSON.parse(readFileSync(resolve(root, "scripts/carta-tragos.json"), "utf8"));

// Lo suelto es todo lo que no es un combo (los combos ya salen en "La de la casa").
const nombresCombo = new Set(opciones.map((o) => o.nombre.toLowerCase()));
const sueltos = productos.filter((p) => !nombresCombo.has(p.nombre.toLowerCase()));
const sinSolo = (s) => s.replace(/\s+sol[oa]$/iu, "");
const DE_COMER = /s[áa]nguche|sandwich|pizza|tabla|papas|empanada|postre|torta/iu;
const comer = sueltos.filter((p) => DE_COMER.test(p.nombre)).map((p) => ({ ...p, nombre: sinSolo(p.nombre) }));
// El trago suelto no va en "Para tomar": tiene sus propias secciones más abajo, con los nombres.
const tomar = sueltos
  .filter((p) => !DE_COMER.test(p.nombre) && !/^trago/iu.test(p.nombre))
  .map((p) => ({ ...p, nombre: sinSolo(p.nombre) }));

/** Una hoja A4 entera, con su encabezado y su pie. */
function hoja(subtitulo, cuerpo) {
  return (
    `<article class="hoja">\n  <header>\n${conLogo ? `    <img class="logo" src="${logo}" alt="" />\n` : ""}` +
    `    <p class="marca">CatDog</p>\n    <p class="sub">${esc(subtitulo)}</p>\n    <div class="filete"></div>\n  </header>\n\n` +
    `  <main>\n${cuerpo}  </main>\n\n` +
    `  <footer>\n    <p>Se pide y se paga en la barra · efectivo, tarjeta o transferencia</p>\n    <p>Instagram @cenascatdog · ${esc(sitio.replace(/^https?:\/\//u, ""))}</p>\n  </footer>\n</article>`
  );
}

// La dirección pública, nunca la de desarrollo: un QR impreso que apunte a localhost no le sirve a
// nadie, y en .env.local NEXT_PUBLIC_SITE_URL es justamente localhost.
const sitio =
  [process.env.NEXT_PUBLIC_SITE_URL, readFileSync(resolve(root, ".env.local"), "utf8").match(/^NEXT_PUBLIC_SITE_URL="?([^"\n\r]+)/m)?.[1]]
    .filter((u) => u && !/localhost|127\.0\.0\.1/u.test(u))
    .map((u) => u.replace(/\/$/, ""))[0] ?? "https://catdog-omega.vercel.app";
const qr = await QRCode.toString(`${sitio}/hoy/jugar?de=qr`, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
const juegos =
  `    <section class="juegos">\n` +
  `      <div class="qr">${qr}</div>\n` +
  `      <div>\n        <h2>Mientras esperás</h2>\n` +
  `        <p class="bajada">Once juegos para la mesa. Si llegás a la marca en los que hacen falta, la casa te invita un trago.</p>\n` +
  `        <p class="nota">Escaneá con la cámara del teléfono. No hay que bajar nada.</p>\n      </div>\n    </section>\n`;

// Dos caras: la comida de un lado y la barra del otro. En una sola hoja no entra sin achicar la
// letra hasta que no se lea, y esto se imprime para plastificar y dejar en la mesa.
const laComida =
  seccion("La de la casa", opciones.map((o) => ({ ...o, nombre: `Sánguche ${o.nombre.toLowerCase()}` })), {
    bajada: v("barra:incluye"),
  }) +
  `    <div class="cols">\n      <div>\n` +
  seccion("Para tomar", tomar) +
  `      </div>\n      <div>\n` +
  seccion("Para comer", comer) +
  (tarifaHora > 0
    ? seccion("La mesa", [{ nombre: "Pool o ping pong", precio: tarifaHora, desc: "La hora. Pedila en la barra." }])
    : "") +
  `      </div>\n    </div>\n` +
  juegos;

const laBarra = tragos.secciones
  .map((s) => seccion(s.nombre === "De autor" ? "Tragos de autor" : s.nombre, s.items, { precioComun: s.precio, columnas: s.items.length > 5 }))
  .join("\n");

function buscarNavegador() {
  const encontrados = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter((p) => p && existsSync(p));
  if (encontrados.length === 0) throw new Error("No encontré Chrome ni Edge para imprimir.");
  return encontrados;
}

const plantilla = readFileSync(resolve(root, "scripts/carta-plantilla.html"), "utf8");
const logo = readFileSync(resolve(root, "scripts/carta-logo.txt"), "utf8").trim();
const conLogo = process.argv.includes("--logo");
const html = plantilla.replace(
  "{{HOJAS}}",
  [hoja(v("barra:horario"), laComida), hoja("La barra", laBarra)].join("\n"),
);

const salidaHtml = resolve(root, "informe/catdog-carta.html");
writeFileSync(salidaHtml, html);
console.log("escrito:", salidaHtml);

if (process.argv.includes("--pdf")) {
  const navegadores = buscarNavegador();
  const salidaPdf = resolve(root, "informe/catdog-carta.pdf");
  execFileSync(navegadores[0], [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${salidaPdf}`,
    `file:///${salidaHtml.replace(/\\/g, "/")}`,
  ]);
  console.log("escrito:", salidaPdf);
}

// Cómo va a salir impresa en blanco y negro, antes de gastar una hoja.
if (process.argv.includes("--bn")) {
  const navegadores = buscarNavegador();
  const previa = resolve(root, "exports/carta-blanco-y-negro.html");
  mkdirSync(resolve(root, "exports"), { recursive: true });
  writeFileSync(previa, html.replace("</style>", "  html{filter:grayscale(1)}\n</style>"));
  const salidaPng = resolve(root, "exports/carta-blanco-y-negro.png");
  execFileSync(navegadores[0], [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=794,1123",
    "--virtual-time-budget=2000",
    `--screenshot=${salidaPng}`,
    `file:///${previa.replace(/\\/g, "/")}`,
  ]);
  console.log("escrito:", salidaPng);
}
