/**
 * Genera la carta de tragos en PDF (A4, para imprimir y plastificar) a partir de scripts/carta-tragos.json.
 *   node scripts/carta-tragos.mjs            → exports/carta-tragos-oscura.pdf y exports/carta-tragos-clara.pdf
 * Si existe fotos/qr-mp.png (el QR de Mercado Pago bajado de la app), lo usa; si no, un QR con el alias.
 * Necesita Google Chrome instalado (usa su impresión a PDF).
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import QRCode from "qrcode";

const root = resolve(import.meta.dirname, "..");
const data = JSON.parse(readFileSync(resolve(root, "scripts/carta-tragos.json"), "utf8"));
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
mkdirSync(resolve(root, "exports"), { recursive: true });

const price = (n) => "$ " + new Intl.NumberFormat("es-AR").format(n);
const qrMp = resolve(root, "fotos/qr-mp.png");
const hasMpQr = existsSync(qrMp);
const qrSrc = hasMpQr
  ? "data:image/png;base64," + readFileSync(qrMp).toString("base64")
  : await QRCode.toDataURL(`Transferencia · Alias: ${data.pago.alias} · ${data.pago.titular}`, { margin: 1, width: 360 });

function html(theme) {
  const dark = theme === "oscura";
  const bg = dark ? "#141210" : "#f6f1e8";
  const ink = dark ? "#f3ede4" : "#1a150d";
  const muted = dark ? "#a89f94" : "#6b625a";
  const gold = dark ? "#c9a96e" : "#8a6a2f";
  const line = dark ? "rgba(201,169,110,.28)" : "rgba(138,106,47,.35)";
  const sections = data.secciones
    .map(
      (s) => `
      <section class="sec">
        <div class="sec-head"><h2>${s.nombre}</h2><span class="sec-price">${price(s.precio)}</span></div>
        <ul>
          ${s.items.map((i) => `<li><span class="n">${i.nombre}</span>${i.desc ? `<span class="d">${i.desc}</span>` : ""}</li>`).join("")}
        </ul>
      </section>`,
    )
    .join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: ${bg}; color: ${ink}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Inter, system-ui, sans-serif; width: 210mm; height: 297mm; padding: 13mm 14mm 12mm; position: relative; }
    .frame { position: absolute; inset: 7mm; border: 1px solid ${line}; pointer-events: none; }
    .frame::before, .frame::after { content: ""; position: absolute; width: 5mm; height: 5mm; border: 1px solid ${gold}; }
    .frame::before { left: -1px; top: -1px; border-width: 1px 0 0 1px; }
    .frame::after { right: -1px; bottom: -1px; border-width: 0 1px 1px 0; }
    header { text-align: center; margin-bottom: 5mm; }
    .eyebrow { font-size: 8pt; letter-spacing: .3em; text-transform: uppercase; color: ${gold}; }
    h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 400; font-size: 30pt; margin: 2mm 0 1mm; line-height: 1; }
    .sub { color: ${muted}; font-size: 9.5pt; }
    .orn { display: flex; align-items: center; justify-content: center; gap: 3mm; color: ${gold}; font-size: 8pt; margin-top: 2.5mm; }
    .orn::before, .orn::after { content: ""; width: 14mm; height: 1px; background: ${line}; }
    .cols { column-count: 2; column-gap: 8mm; }
    .sec { break-inside: avoid; margin-bottom: 6mm; }
    .sec-head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid ${line}; padding-bottom: 1.2mm; margin-bottom: 1.5mm; }
    h2 { font-family: "Playfair Display", Georgia, serif; font-weight: 400; font-size: 15.5pt; margin: 0; }
    .sec-price { font-family: "Playfair Display", Georgia, serif; color: ${gold}; font-size: 12pt; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { padding: 2mm 0; border-bottom: 1px dotted ${line}; break-inside: avoid; }
    li:last-child { border-bottom: 0; }
    .n { display: block; font-family: "Playfair Display", Georgia, serif; font-size: 12pt; }
    .d { display: block; color: ${muted}; font-size: 8.8pt; line-height: 1.35; margin-top: .6mm; }
    footer { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; display: flex; align-items: center; gap: 6mm; border-top: 1px solid ${line}; padding-top: 4mm; }
    footer img { width: 26mm; height: 26mm; border-radius: 2mm; background: #fff; padding: 1.2mm; }
    footer .t { font-size: 8.5pt; color: ${muted}; line-height: 1.45; }
    footer .t strong { color: ${ink}; font-weight: 500; }
    footer .t .big { font-family: "Playfair Display", Georgia, serif; font-size: 12pt; color: ${ink}; display: block; margin-bottom: .5mm; }
  </style></head><body>
  <div class="frame"></div>
  <header>
    <div class="eyebrow">Cena a puertas cerradas · La Plata</div>
    <h1>${data.titulo}</h1>
    <div class="sub">${data.subtitulo}</div>
    <div class="orn">✦</div>
  </header>
  <div class="cols">${sections}</div>
  <footer>
    <img src="${qrSrc}" alt="QR para pagar">
    <div class="t">
      <span class="big">${hasMpQr ? "Pagá con Mercado Pago escaneando el QR" : "Para pagar, transferí"}</span>
      ${hasMpQr ? `o por transferencia al alias <strong>${data.pago.alias}</strong> (${data.pago.titular}).` : `Alias <strong>${data.pago.alias}</strong> · ${data.pago.titular}<br>El QR te muestra el alias para copiarlo.`}<br>
      ${data.pago.nota}
    </div>
  </footer>
  </body></html>`;
}

for (const theme of ["oscura", "clara"]) {
  const htmlPath = resolve(root, `exports/carta-tragos-${theme}.html`);
  const pdfPath = resolve(root, `exports/carta-tragos-${theme}.pdf`);
  writeFileSync(htmlPath, html(theme), "utf8");
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--no-margins",
    `--print-to-pdf=${pdfPath}`,
    "--virtual-time-budget=8000",
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ], { stdio: "ignore" });
  console.log("OK", pdfPath, hasMpQr ? "(con QR de Mercado Pago)" : "(QR con alias; falta fotos/qr-mp.png)");
}
