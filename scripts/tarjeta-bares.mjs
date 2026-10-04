/**
 * La tarjeta para repartir en mano, en los bares (tamaño tarjeta de crédito, blanco y negro, para plastificar).
 *
 *   node scripts/tarjeta-bares.mjs        → informe/catdog-tarjeta.html
 *   node scripts/tarjeta-bares.mjs --pdf  → también el PDF (necesita Chrome o Edge)
 *
 * Tres hojas de 8: los frentes (todos iguales), los dorsos para cualquiera y los dorsos para la gente
 * que labura en gastronomía. Como cada hoja es toda igual, no importa para qué lado gire la impresora
 * en el doble faz.
 *
 * Cada dorso lleva su propio QR (?de=tarjeta y ?de=tarjeta-gastro): en el panel, Números muestra
 * cuánta gente entró desde cada una.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import QRCode from "qrcode";

const root = resolve(import.meta.dirname, "..");
const SITIO = "https://catdog-omega.vercel.app";
const DIAS = "Lun · Jue · Vie · Sáb";
const HORA = "Desde las 18 hs";
const DONDE = "Calle 66 entre 2 y 3 · La Plata";
// La promo que hace volver la tarjeta: se la quedan en la barra y se vuelve a repartir. Vacío = sin promo.
const PROMO = "Traela a la barra: la primera cerveza va por la casa. Nos la quedamos y se la damos a otro.";

const qr = async (de) =>
  QRCode.toString(`${SITIO}/?de=${de}`, { type: "svg", margin: 0, errorCorrectionLevel: "Q", color: { dark: "#000000", light: "#ffffff" } });

const logo = readFileSync(resolve(root, "public/logo-cd-negro.svg"), "utf8").replace(/<!--[\s\S]*?-->/gu, "");

const frente = `
  <div class="t frente">
    <div class="logo">${logo}</div>
    <p class="frase">Alguien te contó.</p>
    <p class="marca">CatDog</p>
  </div>`;

const dorso = async ({ arriba, bajada, de, dias = DIAS }) => `
  <div class="t dorso">
    <p class="arriba">${arriba}</p>
    ${bajada ? `<p class="bajada">${bajada}</p>` : ""}
    <div class="fila">
      <div class="qr">${await qr(de)}</div>
      <div class="datos">
        <p class="dias">${dias}</p>
        <p class="donde">${HORA}</p>
        <p class="donde">${DONDE}</p>
        <p class="ig">@cenascatdog</p>
      </div>
    </div>
    ${PROMO ? `<p class="promo">${PROMO}</p>` : ""}
  </div>`;

const hoja = (tarjeta) => `<section class="hoja">${Array(8).fill(tarjeta).join("")}</section>`;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>CatDog · tarjeta para repartir</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #000; }
  body { font-family: Georgia, "Times New Roman", serif; }
  /* 85 × 55 mm, el tamaño de una tarjeta de crédito: entra en la billetera. Entre tarjetas, 14 mm
     para que el plástico se pegue contra sí mismo al cortar y no se abra. */
  .hoja {
    width: 210mm; height: 297mm; padding: 17.5mm 13mm 0;
    display: grid; grid-template-columns: 85mm 85mm; grid-auto-rows: 55mm; gap: 14mm;
    justify-content: center; break-after: page;
  }
  .hoja:last-child { break-after: auto; }
  .t { width: 85mm; height: 55mm; border: .3mm dashed #999; position: relative; overflow: hidden; }

  .frente { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .frente .logo svg { width: 17mm; height: 17mm; display: block; }
  .frase { font-style: italic; font-size: 19pt; margin: 3.5mm 0 0; letter-spacing: -.01em; }
  .marca { font-family: system-ui, sans-serif; font-size: 7pt; letter-spacing: .34em; text-transform: uppercase; margin: 2.5mm 0 0; padding-left: .34em; }

  .dorso { padding: 4.5mm 5mm; display: flex; flex-direction: column; }
  .arriba { font-style: italic; font-size: 12.5pt; margin: 0; line-height: 1.15; }
  .bajada { font-family: system-ui, sans-serif; font-size: 8.5pt; margin: 1mm 0 0; line-height: 1.3; }
  .fila { display: flex; align-items: center; gap: 4mm; margin-top: auto; }
  .qr svg { width: 21mm; height: 21mm; display: block; }
  .datos p { font-family: system-ui, sans-serif; margin: 0; line-height: 1.35; }
  .dias { font-size: 8.5pt; font-weight: 700; }
  .donde { font-size: 8.5pt; }
  .ig { font-size: 8.5pt; margin-top: 1mm !important; }
  .promo { font-family: system-ui, sans-serif; font-size: 7.5pt; line-height: 1.3; margin: 2.5mm 0 0; border-top: .25mm solid #000; padding-top: 1.8mm; }
</style></head>
<body>
${hoja(frente)}
${hoja(await dorso({ arriba: "Ahora sabés dónde.", bajada: "Barra, parrilla y mesa de pool. Sin reserva: venís y listo.", de: "tarjeta" }))}
${hoja(await dorso({ arriba: "¿Laburás en gastronomía?", bajada: "Los lunes son tuyos: sentate del otro lado del mostrador.", de: "tarjeta-gastro", dias: "Los lunes" }))}
</body></html>`;

const outDir = resolve(root, "informe");
if (!existsSync(outDir)) mkdirSync(outDir);
const htmlPath = resolve(outDir, "catdog-tarjeta.html");
writeFileSync(htmlPath, html);
console.log("escrito:", htmlPath);

if (process.argv.includes("--pdf")) {
  const navegador = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((p) => existsSync(p));
  if (!navegador) throw new Error("No encontré Chrome ni Edge para hacer el PDF.");
  const pdfPath = resolve(outDir, "catdog-tarjeta.pdf");
  execFileSync(navegador, ["--headless=new", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, `file:///${htmlPath.replace(/\\/gu, "/")}`], {
    stdio: "ignore",
  });
  console.log("escrito:", pdfPath);
}
