import type { Cara, CgId, Fondo, Quien } from "@/lib/novela/tipos";
import { imagenCg, imagenRetrato } from "@/lib/novela/arte";
import { CG_INFO } from "@/lib/novela/guion";
import st from "./Cg.module.css";
import { Cuerpo } from "./Retrato";
import { FondoSvg } from "./Fondo";

/**
 * Escenas ilustradas (las "CG" de la galería): composiciones a pantalla completa con fondo, uno o
 * más personajes, luces y un título. Todo SVG; si el personaje tiene ilustración, se usa esa.
 */

const K = "#0a0a0a";
const W = "#fbf7f2";
const R = "#e0101e";

/** Un personaje ubicado en la escena (x, y = esquina de arriba; alto en unidades del lienzo). */
function Figura({ quien, cara, x, y, alto, noche, espejo }: { quien: Quien; cara: Cara; x: number; y: number; alto: number; noche?: boolean; espejo?: boolean }) {
  const img = imagenRetrato(quien, cara, noche);
  const ancho = (alto * 240) / 330;
  const t = espejo ? `translate(${x + ancho} ${y}) scale(-1 1)` : `translate(${x} ${y})`;
  if (img) {
    return (
      <g transform={t}>
        <image href={img.src} x="0" y="0" width={ancho} height={alto} preserveAspectRatio="xMidYMax meet" />
      </g>
    );
  }
  return (
    <g transform={`${t} scale(${alto / 330})`}>
      <Cuerpo quien={quien} cara={cara} noche={noche} />
    </g>
  );
}

function Marco({ titulo, children, fondo }: { titulo: string; children: React.ReactNode; fondo: Fondo }) {
  return (
    <svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" role="img" aria-label={titulo}>
      <FondoSvg id={fondo} />
      {children}
      {/* viñeta y franja del título, a la manera de Persona */}
      <rect width="400" height="720" fill="url(#cg-vineta)" />
      <defs>
        <radialGradient id="cg-vineta" cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <g transform="rotate(-6 200 70)">
        <rect x="-20" y="44" width="300" height="46" fill={K} />
        <rect x="-20" y="88" width="240" height="8" fill={R} />
        <text x="24" y="78" fill={W} fontFamily="Arial Black, Impact, sans-serif" fontSize="22" letterSpacing="1">
          {titulo.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}

function Lluvia({ n = 60, opacity = 0.35 }: { n?: number; opacity?: number }) {
  return (
    <g stroke={W} strokeWidth="1.6" opacity={opacity}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i * 67) % 420;
        const y = (i * 131) % 720;
        return <path key={i} d={`M${x} ${y} l-8 26`} />;
      })}
    </g>
  );
}

function Bokeh({ color = "#ffd98a", n = 14 }: { color?: string; n?: number }) {
  return (
    <g fill={color}>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={(i * 89) % 400} cy={120 + ((i * 53) % 260)} r={6 + (i % 4) * 5} opacity={0.12 + (i % 3) * 0.06} />
      ))}
    </g>
  );
}

/** Silueta anónima (para las escenas donde no importa quién es). */
function Silueta({ x, y, s = 1, ojos = R }: { x: number; y: number; s?: number; ojos?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-60 200 Q-58 120 0 110 Q58 120 60 200 Z" fill={K} />
      <circle cx="0" cy="70" r="40" fill={K} />
      <path d="M-16 70 l10 -3 M6 67 l10 3" stroke={ojos} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

export function Cg({ id }: { id: CgId }) {
  const img = imagenCg(id);
  if (img) {
    return (
      <div className={st.cg} role="img" aria-label={CG_INFO[id].titulo}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustraciones locales, sin optimizador */}
        <img src={img} alt="" decoding="async" draggable={false} />
        <span className={st.vineta} aria-hidden="true" />
        <span className={st.titulo}>{CG_INFO[id].titulo}</span>
      </div>
    );
  }
  return <CgSvg id={id} />;
}

function CgSvg({ id }: { id: CgId }) {
  switch (id) {
    case "cg-vera":
      return (
        <Marco titulo="Barra de arriba" fondo="terraza">
          <Bokeh />
          <Figura quien="vera" cara="sonrisa" x={70} y={260} alto={430} noche />
          <g transform="translate(60 600)">
            <path d="M0 0 L40 0 L22 30 L22 64 L34 70 L6 70 L18 64 L18 30 Z" fill="none" stroke={W} strokeWidth="3" />
            <path d="M6 6 L34 6 L22 24 L18 24 Z" fill="#f08a2a" opacity="0.85" />
            <circle cx="36" cy="2" r="7" fill="#f2c230" stroke={K} strokeWidth="2" />
          </g>
        </Marco>
      );
    case "cg-teo":
      return (
        <Marco titulo="Su nombre en la marquesina" fondo="diagonal">
          <rect x="40" y="140" width="320" height="90" fill={K} stroke="#ffd98a" strokeWidth="4" />
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={i} cx={52 + i * 20} cy="150" r="4" fill="#ffd98a" />
          ))}
          <text x="200" y="210" textAnchor="middle" fill={W} fontFamily="Arial Black, Impact, sans-serif" fontSize="56" letterSpacing="12">
            TEO
          </text>
          <path d="M40 230 L0 300 L400 300 L360 230 Z" fill="#ffd98a" opacity="0.12" />
          <Figura quien="teo" cara="feliz" x={60} y={270} alto={430} noche />
          <Lluvia n={80} />
        </Marco>
      );
    case "cg-mora":
      return (
        <Marco titulo="La última partida" fondo="pool">
          <path d="M200 0 L40 600 L360 600 Z" fill="#fff3d6" opacity="0.08" />
          <Figura quien="mora" cara="picara" x={60} y={240} alto={440} noche />
          <circle cx="300" cy="620" r="46" fill={K} stroke={W} strokeWidth="3" />
          <circle cx="300" cy="620" r="18" fill={W} />
          <text x="300" y="628" textAnchor="middle" fill={K} fontFamily="Arial Black, sans-serif" fontSize="20">
            8
          </text>
          <circle cx="286" cy="604" r="8" fill={W} opacity="0.5" />
        </Marco>
      );
    case "cg-dante":
      return (
        <Marco titulo="Dos cielos en el lago" fondo="bosque">
          <Figura quien="dante" cara="sonrojo" x={70} y={250} alto={400} noche />
          <path d="M60 630 L340 630 L300 680 L100 680 Z" fill="#5a3420" stroke={K} strokeWidth="4" />
          <circle cx="320" cy="616" r="7" fill="#ffd98a" />
          <circle cx="320" cy="616" r="26" fill="#ffd98a" opacity="0.2" />
          <Bokeh color="#cfe3ff" n={10} />
        </Marco>
      );
    case "cg-sol":
      return (
        <Marco titulo="Revelado pendiente" fondo="oscuro">
          <circle cx="200" cy="300" r="260" fill="#ff1020" opacity="0.12" />
          <Figura quien="sol" cara="sonrojo" x={60} y={240} alto={440} noche />
          <rect x="0" y="0" width="400" height="720" fill="#ff0010" opacity="0.08" />
        </Marco>
      );
    case "cg-celos":
      return (
        <Marco titulo="La misma anécdota" fondo="barra">
          {/* pantalla partida en diagonal */}
          <path d="M0 140 L400 80 L400 720 L0 720 Z" fill={R} opacity="0.35" />
          <path d="M200 100 L230 720" stroke={W} strokeWidth="10" />
          <path d="M200 100 L230 720" stroke={K} strokeWidth="4" />
          <Silueta x={100} y={330} s={1.4} />
          <Silueta x={310} y={330} s={1.4} />
          <text x="200" y="300" textAnchor="middle" fill={W} stroke={K} strokeWidth="3" paintOrder="stroke" fontFamily="Arial Black, Impact, sans-serif" fontSize="90">
            !!
          </text>
        </Marco>
      );
    case "cg-casa":
      return (
        <Marco titulo="La casa llena" fondo="barra">
          <Bokeh n={18} />
          {Array.from({ length: 9 }, (_, i) => (
            <Silueta key={i} x={20 + i * 46} y={430 + (i % 3) * 30} s={0.8 + (i % 2) * 0.15} ojos={i % 3 === 0 ? "#ffd98a" : R} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} transform={`translate(${40 + i * 64} ${400 + (i % 2) * 20}) rotate(${(i % 3) * 8 - 8})`}>
              <path d="M0 0 L22 0 L18 34 L4 34 Z" fill="none" stroke={W} strokeWidth="3" />
              <path d="M2 10 L20 10 L18 34 L4 34 Z" fill="#f2c230" opacity="0.7" />
            </g>
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={(i * 97) % 400} y={140 + ((i * 61) % 260)} width="6" height="10" fill={[R, W, "#f2c230", "#2fbf6a"][i % 4]} transform={`rotate(${(i * 37) % 90} ${(i * 97) % 400} ${140 + ((i * 61) % 260)})`} />
          ))}
        </Marco>
      );
    case "cg-beso":
    case "cg-vera-barra":
    case "cg-sol-techo":
      // Tienen ilustración (ver arriba); por las dudas, una composición simple.
      return (
        <Marco titulo={CG_INFO[id].titulo} fondo={id === "cg-vera-barra" ? "barra" : id === "cg-sol-techo" ? "terraza" : "diagonal"}>
          <Bokeh />
          <Lluvia n={id === "cg-beso" ? 80 : 0} />
        </Marco>
      );
    case "cg-gervasio":
      return (
        <Marco titulo="Primera vez" fondo="puerta">
          {/* la puerta abierta, luz de adentro */}
          <path d="M70 230 L200 230 L200 530 L70 530 Z" fill="#ffcf8a" />
          <path d="M70 530 L200 530 L360 720 L-40 720 Z" fill="#ffcf8a" opacity="0.25" />
          <Figura quien="gervasio" cara="sonrisa" x={40} y={280} alto={420} />
          <g transform="translate(300 600) rotate(-20)">
            <rect x="0" y="0" width="8" height="70" fill="#2f8f4f" stroke={K} strokeWidth="2" />
            <path d="M0 70 L4 84 L8 70 Z" fill="#c9a24a" />
          </g>
        </Marco>
      );
  }
}
