/**
 * El flyer para mandar por WhatsApp (1080×1920, el alto del estado).
 *
 *   node scripts/flyer.mjs                          → exports/catdog-flyer.png
 *   node scripts/flyer.mjs --horario "Desde las 18" → pisa el horario del sitio, para probar
 *   node scripts/flyer.mjs --foto fotos/barra.jpg   → con una foto de fondo
 *   node scripts/flyer.mjs --tipo hoy               → el del día: "Hoy jueves · la casa está abierta"
 *                                                     (el día sale solo, en hora argentina; --dia lo pisa)
 *
 * Sale de los mismos datos que la página y la carta (días, horario, el precio de entrada), así no
 * hay que mantener otra copia más. Imprime también el texto para pegar en el mensaje, con el ?de=wa
 * puesto, que es lo que después le dice al panel cuánta gente entró por WhatsApp.
 *
 * No lleva lista de precios a propósito: un flyer que lo dice todo no deja nada que preguntar, y lo
 * que queremos es que escriban. La dirección exacta es el anzuelo: la casa no tiene cartel.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const arg = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const url = readFileSync(resolve(root, ".env.local"), "utf8").match(/^DATABASE_URL="?([^"\n\r]+)/m)[1];
const sitio =
  [process.env.NEXT_PUBLIC_SITE_URL, readFileSync(resolve(root, ".env.local"), "utf8").match(/^NEXT_PUBLIC_SITE_URL="?([^"\n\r]+)/m)?.[1]]
    .filter((u) => u && !/localhost|127\.0\.0\.1/u.test(u))
    .map((u) => u.replace(/\/$/, ""))[0] ?? "https://catdog-omega.vercel.app";

const CLAVES = ["barra:dias", "barra:horario", "barra:opciones", "barra:hoy", "barra:direccion"];
const cliente = new pg.Client({ connectionString: url });
await cliente.connect();
const { rows } = await cliente.query('SELECT key, value FROM "Setting" WHERE key = ANY($1)', [CLAVES]);
await cliente.end();
const v = (k) => rows.find((r) => r.key === k)?.value?.trim() ?? "";

const dias = (v("barra:dias") || "Lunes, jueves, viernes y sábados")
  .split(/,|\sy\s/u)
  .map((d) => d.trim().replace(/(ado|ingo)s$/iu, "$1"))
  .filter(Boolean)
  .map((d) => d.charAt(0).toUpperCase() + d.slice(1));
const horario = arg("horario") ?? v("barra:horario") ?? "Desde las 20";
// El precio de entrada: la opción más barata. Es el único número del flyer, y va porque un precio
// concreto es lo que convierte "qué lindo" en "cuánto sale".
const precios = (v("barra:opciones") || "")
  .split("\n")
  .map((l) => Number((l.split("|")[1] ?? "").replace(/\D/gu, "")))
  .filter((n) => n > 0);
const desde = precios.length ? Math.min(...precios) : 0;
const zona = v("barra:direccion") || "Calle 66, entre 2 y 3 · La Plata";
const logo = readFileSync(resolve(root, "scripts/carta-logo.txt"), "utf8").trim();
const foto = arg("foto");
const tipo = arg("tipo") ?? "abierta";
/**
 * El del día: qué día es hoy en La Plata (no en el reloj de la compu). Si hoy no está entre los días
 * que abre, avisa: un "hoy abrimos" un día que no se abre es peor que no publicar nada.
 */
const hoy = (
  arg("dia") ??
  new Intl.DateTimeFormat("es-AR", { weekday: "long", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date())
).toLowerCase();
const sinTilde = (s) => s.normalize("NFD").replace(/[̀-ͯ]/gu, "").toLowerCase();
if (tipo === "hoy" && !(v("barra:dias") || "").split(/,|\sy\s/u).some((d) => sinTilde(d).trim().startsWith(sinTilde(hoy).slice(0, 3)))) {
  console.warn(`OJO: hoy es ${hoy} y no está entre los días que abre (${v("barra:dias")}). Usá --dia si es otro día.`);
}
// La contraseña de la semana: el nombre de uno de los tragos de la casa, que ya suena a password.
const palabra = (arg("palabra") ?? "Hormiga Negra").trim();
/**
 * WhatsApp tapa con su interfaz unos 250 px arriba (nombre y barritas) y unos 400 abajo (la barra
 * de responder). Todo lo que importa tiene que entrar en esa franja del medio, con margen, porque
 * cuánto tapa cambia según el teléfono. Con --guias se dibuja la franja para comprobarlo.
 */
const SEGURO_ARRIBA = 260;
const SEGURO_ABAJO = 420;
// "estado" es el alto de la pantalla; "chat" es más cuadrado, que es como se ve reenviado en un chat.
const formato = arg("formato") ?? "estado";
const ALTO = formato === "chat" ? 1350 : 1920;
const guias = process.argv.includes("--guias");
const fondo = foto && existsSync(resolve(root, foto)) ? `data:image/jpeg;base64,${readFileSync(resolve(root, foto)).toString("base64")}` : null;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plata = (n) => "$" + new Intl.NumberFormat("es-AR").format(n);

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1080px;height:${ALTO}px}
  body{background:#141210;color:#f3ede4;font-family:Inter,system-ui,sans-serif;overflow:hidden}
  .hoja{position:relative;width:1080px;height:${ALTO}px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;text-align:center;
        padding:${formato === "chat" ? 90 : SEGURO_ARRIBA}px 90px ${formato === "chat" ? 90 : SEGURO_ABAJO}px}
  ${fondo ? `.foto{position:absolute;inset:0;background:url('${fondo}') center/cover;opacity:.3;filter:grayscale(.3)}` : ""}
  /* El marco fino: lo mismo que tiene el afiche de la página. */
  /* El grano de papel impreso, igual que el afiche de la página: es lo que saca al negro de parecer
     una diapositiva. Va por encima de todo menos del texto. */
  .grano{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.12;
         background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
         background-size:220px 220px}
  /* Viñeta: oscurece los bordes para que el ojo caiga en el centro. */
  .vineta{position:absolute;inset:0;z-index:1;pointer-events:none;
          background:radial-gradient(ellipse 72% 55% at 50% 46%, transparent 40%, rgba(0,0,0,.55) 100%)}

  /* Pegados a la franja que se ve, no a la hoja: si no, la interfaz de WhatsApp los corta al medio. */
  /* Por encima de la viñeta: si no, el degradado apaga justo las esquinas, que es lo que se mira. */
  .marco{position:absolute;z-index:2;left:44px;right:44px;border:2px solid rgba(201,169,110,.3);
         top:${formato === "chat" ? 44 : SEGURO_ARRIBA - 36}px;bottom:${formato === "chat" ? 44 : SEGURO_ABAJO - 36}px}
  .marco span{position:absolute;width:42px;height:42px;border:3px solid rgba(201,169,110,.75)}
  .marco span:nth-child(1){left:-3px;top:-3px;border-width:3px 0 0 3px}
  .marco span:nth-child(2){right:-3px;top:-3px;border-width:3px 3px 0 0}
  .marco span:nth-child(3){left:-3px;bottom:-3px;border-width:0 0 3px 3px}
  .marco span:nth-child(4){right:-3px;bottom:-3px;border-width:0 3px 3px 0}
  /* El rescoldo de abajo, como en la página. */
  /* Encima de la viñeta, si no el degradado se come el rescoldo justo donde tiene que estar. */
  .brasas{position:absolute;z-index:2;left:0;right:0;bottom:${formato === "chat" ? 0 : SEGURO_ABAJO - 36}px;height:520px;
          background:radial-gradient(ellipse 70% 100% at 50% 118%, rgba(201,169,110,.30), transparent 70%)}
  .dentro{position:relative;z-index:2;width:100%}
  .logo{width:190px;border-radius:18px;display:block;margin:0 auto 56px}
  .eyebrow{font-size:30px;letter-spacing:.42em;text-transform:uppercase;color:#c9a96e}
  .marca-chica{font-size:44px;letter-spacing:.46em;text-transform:uppercase;color:#c9a96e}
  h1{font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:118px;line-height:1.02;margin-top:30px}
  .filete{width:200px;height:2px;background:rgba(201,169,110,.55);margin:44px auto}
  .dias{display:flex;flex-wrap:wrap;gap:18px;justify-content:center}
  .dias span{border:2px solid rgba(201,169,110,.5);border-radius:999px;padding:14px 32px;
             font-family:'Playfair Display',Georgia,serif;font-size:38px}
  .horario{margin-top:36px;font-size:32px;letter-spacing:.3em;text-transform:uppercase;color:#9a9187}
  .gancho{margin-top:56px;font-family:'Playfair Display',Georgia,serif;font-size:58px;line-height:1.26}
  .gancho b{color:#e0c283;font-weight:500}
  .sin-reserva{margin-top:30px;font-size:34px;color:#9a9187;line-height:1.5}
  .pregunta{margin-top:58px;border:2px solid rgba(201,169,110,.45);border-radius:28px;padding:44px 48px}
  .secreto .pedido{margin-top:66px}
  .secreto .pedido p{font-family:'Playfair Display',Georgia,serif;font-size:50px;line-height:1.26}
  .secreto .pedido small{display:block;margin-top:18px;font-size:33px;color:#9a9187}
  .pregunta p{font-family:'Playfair Display',Georgia,serif;font-size:46px;line-height:1.3}
  .pregunta small{display:block;margin-top:22px;font-size:34px;color:#9a9187;letter-spacing:.04em}
  /* El flyer de la contraseña: casi vacío a propósito. Lo que no se cuenta es lo que hace preguntar. */
  .secreto{justify-content:center}
  .secreto .brasas{height:660px;background:radial-gradient(ellipse 62% 100% at 50% 122%, rgba(201,169,110,.30), transparent 70%)}
  h1.chico{font-size:112px;margin-top:28px}
  .placa{margin-top:76px;padding:14px 0 30px;border-top:1px solid rgba(201,169,110,.45);border-bottom:1px solid rgba(201,169,110,.45)}
  .susurro{font-size:27px;letter-spacing:.46em;text-transform:uppercase;color:#9a9187}
  .palabra{margin-top:16px;font-family:'Playfair Display',Georgia,serif;font-size:128px;line-height:1.04;color:#e0c283;
           text-shadow:0 0 70px rgba(201,169,110,.28)}
  /* El adorno de la página, que acá separa la marca de lo que viene. */
  .adorno{display:flex;align-items:center;justify-content:center;gap:26px;margin-top:26px;color:rgba(201,169,110,.65);font-size:26px}
  .adorno i{display:block;width:110px;height:1px;background:rgba(201,169,110,.5)}
  .secreto .pregunta{margin-top:80px}
  /* El del día: "Hoy jueves" es lo primero que se lee, en dorado; el horario, grande y claro. */
  .hoy-dia{margin-top:46px;font-size:50px;letter-spacing:.34em;text-transform:uppercase;color:#e0c283;
           text-shadow:0 0 50px rgba(201,169,110,.25)}
  .hoy-dia+h1{margin-top:22px}
  .hoy-hora{font-family:'Playfair Display',Georgia,serif;font-size:76px;line-height:1.1;color:#f3ede4}
  .secreto .sin-reserva{margin-top:64px;font-size:34px;letter-spacing:.14em;text-transform:uppercase}
  /* Dentro del flujo y no pegado abajo: ahí lo tapa la barra de responder de WhatsApp. */
  footer{margin-top:52px;text-align:center;font-size:32px;letter-spacing:.2em;text-transform:uppercase;color:#9a9187}
  footer p+p{margin-top:16px;color:#c9a96e;letter-spacing:.1em;text-transform:none;font-size:36px}
  ${guias ? `.guia{position:absolute;left:0;right:0;z-index:9;background:rgba(181,83,60,.28)}
  .guia.arriba{top:0;height:${SEGURO_ARRIBA}px}
  .guia.abajo{bottom:0;height:${SEGURO_ABAJO}px}` : ""}
</style></head>
<body>
<div class="hoja ${tipo === "contrasena" ? "secreto" : ""}">
  ${fondo ? '<div class="foto"></div>' : ""}
  <div class="brasas"></div>
  <div class="marco"><span></span><span></span><span></span><span></span></div>
  <div class="grano"></div>
  <div class="vineta"></div>
  ${guias && formato !== "chat" ? '<div class="guia arriba"></div><div class="guia abajo"></div>' : ""}
  <div class="dentro">
    ${
      tipo === "contrasena"
        ? `<p class="marca-chica">CatDog</p>
    <div class="adorno"><i></i>✦<i></i></div>
    <div class="placa">
      <p class="susurro">La contraseña de esta semana</p>
      <p class="palabra">${esc(palabra)}</p>
    </div>
    <div class="pedido">
      <p>Mandanos la contraseña por mensaje</p>
      <small>y te pasamos la dirección exacta.</small>
    </div>
    <p class="sin-reserva">${esc(dias.join(" · "))}<br />${esc(horario)} · Sin reserva</p>`
        : tipo === "hoy"
          ? `<p class="marca-chica">CatDog</p>
    <div class="adorno"><i></i>✦<i></i></div>
    <p class="hoy-dia">Hoy ${esc(hoy)}</p>
    <h1>La casa<br />está abierta</h1>
    <div class="filete"></div>
    <p class="hoy-hora">${esc(horario)}</p>
    ${desde > 0 ? `<p class="gancho">Sánguche y algo para tomar<br /><b>desde ${plata(desde)}</b></p>` : ""}
    <p class="sin-reserva">Barra, parrilla y mesa de pool / ping pong.<br />Sin reserva.</p>`
          : `<p class="marca-chica">CatDog</p>
    <h1>La casa<br />está abierta</h1>
    <div class="filete"></div>
    <div class="dias">${dias.map((d) => `<span>${esc(d)}</span>`).join("")}</div>
    <p class="horario">${esc(horario)}</p>
    ${desde > 0 ? `<p class="gancho">Sánguche y algo para tomar<br /><b>desde ${plata(desde)}</b></p>` : ""}
    <p class="sin-reserva">Barra, parrilla y mesa de pool / ping pong.<br />Sin reserva.</p>
`
    }
  </div>
  <footer>
    ${tipo === "contrasena" ? "" : `<p>${esc(zona)}</p>`}
    <p>@cenascatdog</p>
  </footer>
</div>
</body></html>`;

mkdirSync(resolve(root, "exports"), { recursive: true });
const nombre =
  (tipo === "contrasena" ? "catdog-flyer-contrasena" : tipo === "hoy" ? `catdog-flyer-hoy-${sinTilde(hoy)}` : "catdog-flyer") +
  (formato === "chat" ? "-chat" : "") +
  (guias ? "-guias" : "");
const salidaHtml = resolve(root, `exports/${nombre}.html`);
writeFileSync(salidaHtml, html);

const navegadores = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((p) => p && existsSync(p));
if (navegadores.length === 0) throw new Error("No encontré Chrome ni Edge para sacar la imagen.");
const salidaPng = resolve(root, `exports/${nombre}.png`);
execFileSync(navegadores[0], [
  "--headless",
  "--disable-gpu",
  "--hide-scrollbars",
  `--window-size=1080,${ALTO}`,
  "--default-background-color=141210",
  // Dos segundos para que bajen las tipografías antes de la foto.
  "--virtual-time-budget=2000",
  `--screenshot=${salidaPng}`,
  `file:///${salidaHtml.replace(/\\/g, "/")}`,
]);
// WhatsApp recomprime igual, pero el JPG es lo que esperan la galería y la historia.
const salidaJpg = salidaPng.replace(/.png$/u, ".jpg");
await sharp(salidaPng).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(salidaJpg);
console.log("escrito:", salidaJpg);

console.log("\n--- para pegar en WhatsApp ---\n");
console.log(
  tipo === "contrasena"
    ? [
        `La casa no tiene cartel en la calle. 🔑`,
        "",
        `*La contraseña de esta semana: ${palabra}.*`,
        "",
        "Mandámela por acá y te paso la dirección exacta.",
        `${dias.join(", ")}, ${horario.toLowerCase()}. Sin reserva.`,
        "",
        `${sitio}/?de=wa`,
      ].join("\n")
    : tipo === "hoy"
      ? [
          `*Hoy ${hoy} la casa está abierta* · ${horario.toLowerCase()}.`,
          "",
          "Barra, parrilla y mesa de pool / ping pong, en una casa del casco de La Plata.",
          desde > 0 ? `Sánguche y algo para tomar desde ${plata(desde)}. Sin reserva: caés y listo.` : "Sin reserva: caés y listo.",
          "",
          `📍 ${zona}`,
          "",
          `${sitio}/?de=wa`,
        ].join("\n")
      : [
    `*La casa está abierta* · ${dias.join(", ")}, ${horario.toLowerCase()}.`,
    "",
    "Barra, parrilla y mesa de pool, en una casa del casco de La Plata.",
    desde > 0 ? `Sánguche y algo para tomar desde ${plata(desde)}. Sin reserva: caés y listo.` : "Sin reserva: caés y listo.",
    "",
    "No tenemos cartel en la calle: escribinos y te pasamos la dirección exacta.",
    "",
    `${sitio}/?de=wa`,
  ].join("\n"),
);
