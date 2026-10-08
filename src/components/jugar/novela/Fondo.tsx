import type { Fondo as FondoId } from "@/lib/novela/tipos";
import { imagenFondo } from "@/lib/novela/arte";
import s from "./Fondo.module.css";

/**
 * Fondos de escena en SVG: siluetas negras sobre rojo y gris, rayos de luz en diagonal.
 * Todo determinista (nada de azar): se dibuja igual siempre. Donde hay ilustración (ver `arte.ts`)
 * se usa la imagen con una capa encima, a la manera de Persona, para que el texto se lea.
 */

const K = "#0a0a0a";
const R = "#c10c1a";
const R2 = "#7d0610";
const W = "#fbf7f2";

function Rayos({ color = W, opacity = 0.07 }: { color?: string; opacity?: number }) {
  return (
    <g fill={color} opacity={opacity}>
      <path d="M-40 0 L60 0 L420 720 L320 720 Z" />
      <path d="M140 0 L180 0 L460 560 L460 640 Z" />
      <path d="M-60 260 L-60 320 L240 720 L180 720 Z" />
    </g>
  );
}

function Botellas({ y, n, alto }: { y: number; n: number; alto: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = 18 + i * (380 / n);
        const h = alto * (0.7 + ((i * 37) % 10) / 30);
        const ancho = 14 + ((i * 13) % 3) * 4;
        const roja = i % 4 === 1;
        return (
          <g key={i}>
            <rect x={x} y={y - h} width={ancho} height={h} rx="3" fill={roja ? R : K} />
            <rect x={x + ancho / 2 - 3} y={y - h - 16} width="6" height="18" fill={roja ? R : K} />
            {i % 3 === 0 && <rect x={x + 3} y={y - h + 12} width="3" height={h - 22} fill={W} opacity="0.35" />}
          </g>
        );
      })}
      <rect x="0" y={y} width="400" height="8" fill={K} />
    </g>
  );
}

function Barra() {
  return (
    <g>
      <rect width="400" height="720" fill={R} />
      <Rayos />
      <Botellas y={170} n={11} alto={70} />
      <Botellas y={300} n={9} alto={84} />
      {/* Lámparas colgantes */}
      {[90, 310].map((x) => (
        <g key={x}>
          <path d={`M${x} 0 V60`} stroke={K} strokeWidth="3" />
          <path d={`M${x - 26} 84 L${x - 12} 58 L${x + 12} 58 L${x + 26} 84 Z`} fill={K} />
          <path d={`M${x - 26} 84 L${x - 110} 420 L${x + 110} 420 L${x + 26} 84 Z`} fill="#ffd9a0" opacity="0.12" />
        </g>
      ))}
      {/* Barra en diagonal */}
      <path d="M0 470 L400 410 L400 720 L0 720 Z" fill={K} />
      <path d="M0 470 L400 410 L400 424 L0 486 Z" fill={W} />
      <path d="M0 486 L400 424 L400 432 L0 496 Z" fill={R2} />
      {/* Vasos sobre la barra */}
      <path d="M48 466 l18 -3 l-3 -36 l-14 2 z" fill="none" stroke={W} strokeWidth="2.5" />
      <path d="M300 430 l26 -4 l-12 18 l0 14 l6 0 l-14 2 l6 -2 l0 -14 z" fill="none" stroke={W} strokeWidth="2.5" />
    </g>
  );
}

function Puerta() {
  return (
    <g>
      <rect width="400" height="720" fill="#12090b" />
      <circle cx="320" cy="90" r="40" fill={W} opacity="0.9" />
      <circle cx="306" cy="80" r="40" fill="#12090b" />
      {/* Fachada */}
      <path d="M30 150 L370 120 L370 720 L30 720 Z" fill={R2} />
      <path d="M30 150 L370 120 L370 138 L30 168 Z" fill={K} />
      {/* Ventana con reja */}
      <rect x="236" y="220" width="104" height="150" fill="#ffcf8a" opacity="0.85" />
      {[248, 268, 288, 308, 328].map((x) => (
        <rect key={x} x={x} y="214" width="5" height="162" fill={K} />
      ))}
      {/* La puerta sin cartel */}
      <rect x="70" y="230" width="130" height="300" fill={K} />
      <rect x="82" y="244" width="106" height="130" fill="#2a1614" />
      <rect x="82" y="386" width="106" height="130" fill="#2a1614" />
      <circle cx="178" cy="380" r="5" fill={W} />
      {/* Donde iría el cartel: nada */}
      <rect x="84" y="184" width="104" height="30" fill="none" stroke={W} strokeWidth="2.5" strokeDasharray="7 6" opacity="0.7" />
      {/* Vereda en diagonal y reja */}
      <path d="M0 560 L400 520 L400 720 L0 720 Z" fill={K} />
      <path d="M0 560 L400 520 L400 530 L0 572 Z" fill={W} opacity="0.85" />
      {[20, 46, 212, 238, 264, 290, 316, 342, 368].map((x, i) => (
        <rect key={x} x={x} y={430 - i * 1.5} width="6" height="130" fill={K} />
      ))}
      <rect x="0" y="430" width="400" height="8" fill={K} transform="rotate(-5.7 200 430)" />
      {/* Dos perros asomando, de orejas caídas */}
      <g fill={K}>
        <ellipse cx="236" cy="518" rx="22" ry="19" />
        <ellipse cx="236" cy="532" rx="12" ry="9" />
        <ellipse cx="214" cy="520" rx="7" ry="16" transform="rotate(18 214 520)" />
        <ellipse cx="258" cy="520" rx="7" ry="16" transform="rotate(-18 258 520)" />
        <ellipse cx="294" cy="512" rx="20" ry="17" />
        <ellipse cx="294" cy="525" rx="11" ry="8" />
        <ellipse cx="274" cy="514" rx="6" ry="15" transform="rotate(20 274 514)" />
        <ellipse cx="314" cy="514" rx="6" ry="15" transform="rotate(-20 314 514)" />
      </g>
      <g fill={W}>
        <circle cx="229" cy="512" r="2.5" />
        <circle cx="243" cy="512" r="2.5" />
        <circle cx="288" cy="507" r="2.5" />
        <circle cx="300" cy="507" r="2.5" />
      </g>
      <g fill={R}>
        <ellipse cx="236" cy="528" rx="4" ry="3" />
        <ellipse cx="294" cy="521" rx="4" ry="3" />
      </g>
    </g>
  );
}

function Pool() {
  return (
    <g>
      <rect width="400" height="720" fill="#160c0d" />
      <Rayos color={R} opacity={0.18} />
      {/* Lámpara y cono de luz */}
      <path d="M200 0 V120" stroke={K} strokeWidth="4" />
      <path d="M130 150 L160 116 L240 116 L270 150 Z" fill={R} stroke={K} strokeWidth="4" />
      <path d="M130 150 L20 520 L380 520 L270 150 Z" fill="#fff3d6" opacity="0.13" />
      {/* Mesa en perspectiva */}
      <path d="M70 360 L330 360 L392 560 L8 560 Z" fill={K} />
      <path d="M86 370 L314 370 L370 548 L30 548 Z" fill="#1d5a3e" />
      <path d="M86 370 L314 370 L320 388 L80 388 Z" fill="#164a33" />
      {[[86, 370], [314, 370], [30, 548], [370, 548], [200, 370], [200, 548]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill={K} />
      ))}
      {/* Bolas */}
      <circle cx="160" cy="450" r="11" fill={W} />
      <circle cx="236" cy="430" r="11" fill={K} stroke={W} strokeWidth="2" />
      <circle cx="236" cy="430" r="4" fill={W} />
      <circle cx="262" cy="478" r="11" fill={R} />
      <circle cx="110" cy="510" r="11" fill="#f2c230" />
      <path d="M0 560 L400 560 L400 720 L0 720 Z" fill={K} />
      <path d="M40 720 L130 600" stroke="#c8a26a" strokeWidth="7" />
    </g>
  );
}

function Cocina() {
  return (
    <g>
      <rect width="400" height="720" fill="#e9e3da" />
      {/* Azulejos */}
      <g stroke="#bdb3a6" strokeWidth="2">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 40} H400`} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 40} 0 V480`} />
        ))}
      </g>
      <path d="M0 0 L400 0 L400 140 L0 260 Z" fill={R} opacity="0.92" />
      {/* Ollas colgadas */}
      <path d="M40 60 H360" stroke={K} strokeWidth="5" />
      {[[80, 34], [170, 26], [262, 38], [330, 22]].map(([x, r]) => (
        <g key={x}>
          <path d={`M${x} 60 V${90}`} stroke={K} strokeWidth="3" />
          <circle cx={x} cy={90 + r} r={r} fill={K} />
          <path d={`M${x - r * 0.5} ${90 + r * 0.6} Q${x} ${90 + r * 0.2} ${x + r * 0.5} ${90 + r * 0.6}`} stroke={W} strokeWidth="3" fill="none" opacity="0.6" />
        </g>
      ))}
      {/* Vapor */}
      <g fill="none" stroke={W} strokeWidth="6" strokeLinecap="round" opacity="0.8">
        <path d="M150 440 Q130 400 150 370 Q170 340 150 300" />
        <path d="M210 440 Q230 410 210 380 Q190 350 214 316" />
      </g>
      {/* Mesada y hornalla */}
      <path d="M0 470 L400 440 L400 720 L0 720 Z" fill={K} />
      <path d="M0 470 L400 440 L400 452 L0 484 Z" fill="#9aa0a6" />
      <ellipse cx="180" cy="456" rx="70" ry="10" fill={R} opacity="0.85" />
      <rect x="120" y="400" width="120" height="52" rx="6" fill="#2b2b2b" stroke={W} strokeWidth="2.5" />
    </g>
  );
}

function Tilo({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={K}>
      <rect x="-8" y="0" width="16" height="200" />
      <circle cx="0" cy="-30" r="70" />
      <circle cx="-56" cy="10" r="48" />
      <circle cx="56" cy="6" r="52" />
      <circle cx="0" cy="40" r="44" />
    </g>
  );
}

function Vereda() {
  return (
    <g>
      <rect width="400" height="720" fill="#0d0a14" />
      {/* Cielo con trama de puntos */}
      <defs>
        <pattern id="nv-puntos" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3" cy="3" r="1.6" fill={R} opacity="0.45" />
        </pattern>
      </defs>
      <rect width="400" height="520" fill="url(#nv-puntos)" />
      <circle cx="90" cy="110" r="46" fill={W} />
      <circle cx="74" cy="100" r="46" fill="#0d0a14" opacity="0.88" />
      {/* Edificios */}
      <path d="M0 330 L0 220 L70 220 L70 180 L150 180 L150 260 L260 260 L260 200 L340 200 L340 240 L400 240 L400 330 Z" fill="#1a1020" />
      {[[90, 196], [110, 196], [280, 216], [300, 216], [18, 236], [360, 256]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="10" height="14" fill="#ffcf8a" opacity="0.8" />
      ))}
      <Tilo x={60} y={330} s={1} />
      <Tilo x={340} y={300} s={1.1} />
      {/* La diagonal */}
      <path d="M0 520 L400 400 L400 720 L0 720 Z" fill={K} />
      <path d="M0 640 L400 470" stroke={W} strokeWidth="6" strokeDasharray="40 30" opacity="0.8" />
      <path d="M0 520 L400 400" stroke={R} strokeWidth="10" />
      {/* Farol */}
      <rect x="236" y="250" width="8" height="250" fill={K} />
      <path d="M222 252 L258 252 L250 230 L230 230 Z" fill={K} />
      <path d="M226 252 L150 520 L330 520 L254 252 Z" fill="#ffe2a8" opacity="0.14" />
      <circle cx="240" cy="246" r="7" fill="#ffe2a8" />
    </g>
  );
}

function Pasillo() {
  return (
    <g>
      <rect width="400" height="720" fill="#1a0c0e" />
      <Rayos color={R} opacity={0.2} />
      {/* Biblioteca */}
      <rect x="40" y="80" width="320" height="460" fill={K} />
      {[0, 1, 2, 3].map((fila) => (
        <g key={fila}>
          {Array.from({ length: 14 }, (_, i) => {
            const alto = 70 + ((i * 7 + fila * 11) % 5) * 6;
            const ancho = 14 + ((i + fila) % 3) * 4;
            const x = 52 + i * 21;
            const base = 186 + fila * 110;
            const color = (i + fila) % 5 === 0 ? R : (i + fila) % 3 === 0 ? W : "#4b3b36";
            return x + ancho < 352 ? <rect key={i} x={x} y={base - alto} width={ancho} height={alto} fill={color} opacity={color === W ? 0.75 : 1} /> : null;
          })}
          <rect x="40" y={186 + fila * 110} width="320" height="8" fill="#3a2a24" />
        </g>
      ))}
      {/* El cuaderno, con luz propia */}
      <rect x="132" y="560" width="136" height="90" rx="4" fill="#4a2a1a" stroke={W} strokeWidth="3" transform="rotate(-6 200 605)" />
      <path d="M200 558 L196 650" stroke={W} strokeWidth="2" transform="rotate(-6 200 605)" />
      <circle cx="200" cy="605" r="110" fill="#5dff9a" opacity="0.07" />
      {/* Planta */}
      <path d="M320 600 Q300 520 330 470 M330 600 Q350 530 380 500 M326 600 Q330 540 300 500" stroke="#1e5a32" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M300 600 L360 600 L352 660 L308 660 Z" fill={R} />
    </g>
  );
}

function Plaza() {
  return (
    <g>
      <rect width="400" height="720" fill="#08060c" />
      <defs>
        <pattern id="nv-estrellas" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="14" r="1.4" fill={W} />
          <circle cx="44" cy="40" r="1" fill={W} />
          <circle cx="30" cy="6" r="0.8" fill={W} />
        </pattern>
      </defs>
      <rect width="400" height="420" fill="url(#nv-estrellas)" opacity="0.8" />
      {/* Torres de una catedral a lo lejos */}
      <path d="M150 400 L150 220 L170 160 L190 220 L190 400 Z M230 400 L230 220 L250 160 L270 220 L270 400 Z M190 400 L190 280 L230 280 L230 400 Z" fill="#1d1426" />
      <Tilo x={40} y={360} s={1.1} />
      <Tilo x={380} y={380} s={0.9} />
      <path d="M0 470 Q200 430 400 470 L400 720 L0 720 Z" fill={K} />
      {/* Banco */}
      <path d="M100 560 L300 540 L300 556 L100 576 Z" fill={R} />
      <path d="M110 576 L110 610 M290 556 L290 592" stroke={R} strokeWidth="6" />
      <circle cx="200" cy="300" r="140" fill={R} opacity="0.08" />
    </g>
  );
}

// ─── Fondos de la temporada 2 ────────────────────────────────────────────────────────────────

/** La Rana: el bar donde labura Vera. Neón verde con forma de sapo. */
function Rana() {
  return (
    <g>
      <rect width="400" height="720" fill="#07140d" />
      <Rayos color="#2bff88" opacity={0.06} />
      {/* pared de ladrillos oscuros */}
      <g fill="#0f2418">
        {Array.from({ length: 14 }, (_, f) =>
          Array.from({ length: 6 }, (_, c) => <rect key={`${f}-${c}`} x={c * 70 + (f % 2 ? 35 : 0) - 20} y={40 + f * 24} width="64" height="20" />),
        )}
      </g>
      {/* el sapo de neón */}
      <g fill="none" stroke="#3dff8f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M120 170 Q200 100 280 170 Q300 220 250 240 L150 240 Q100 220 120 170 Z" />
        <circle cx="160" cy="150" r="18" />
        <circle cx="240" cy="150" r="18" />
        <path d="M160 200 Q200 225 240 200" />
        <path d="M150 240 L130 270 M250 240 L270 270" />
      </g>
      <g fill="none" stroke="#3dff8f" strokeWidth="16" opacity="0.15">
        <path d="M120 170 Q200 100 280 170 Q300 220 250 240 L150 240 Q100 220 120 170 Z" />
      </g>
      <text x="200" y="320" textAnchor="middle" fill="#ff3b6b" fontFamily="Georgia, serif" fontStyle="italic" fontSize="44" opacity="0.9">
        La Rana
      </text>
      {/* barra y botellas */}
      <path d="M0 480 L400 440 L400 720 L0 720 Z" fill={K} />
      <path d="M0 480 L400 440 L400 452 L0 494 Z" fill="#3dff8f" opacity="0.7" />
      {[40, 90, 140, 300, 350].map((x, i) => (
        <rect key={x} x={x} y={400 - (i % 3) * 14} width="18" height={50 + (i % 3) * 14} rx="3" fill={i % 2 ? "#1f6b45" : R2} />
      ))}
    </g>
  );
}

/** La terraza del edificio de Vera: la ciudad abajo, la catedral iluminada, lamparitas. */
function Terraza() {
  return (
    <g>
      <rect width="400" height="720" fill="#0b0816" />
      <defs>
        <linearGradient id="nv-cielo-terraza" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120a24" />
          <stop offset="1" stopColor="#3a1020" />
        </linearGradient>
      </defs>
      <rect width="400" height="460" fill="url(#nv-cielo-terraza)" />
      <circle cx="320" cy="90" r="30" fill={W} opacity="0.9" />
      {/* la ciudad: edificios bajos con ventanas */}
      <path d="M0 460 L0 380 L40 380 L40 350 L90 350 L90 390 L130 390 L130 340 L170 340 L170 400 L230 400 L230 360 L280 360 L280 330 L330 330 L330 380 L400 380 L400 460 Z" fill="#150c1c" />
      {Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={10 + ((i * 53) % 380)} y={350 + ((i * 29) % 90)} width="5" height="7" fill="#ffcf8a" opacity={0.5 + (i % 3) * 0.15} />
      ))}
      {/* la catedral, iluminada */}
      <path d="M170 400 L170 250 L184 200 L198 250 L198 400 Z M214 400 L214 250 L228 200 L242 250 L242 400 Z M198 400 L198 300 L214 300 L214 400 Z" fill="#3a2440" />
      <path d="M170 400 L170 250 L184 200 L198 250 L198 400 Z M214 400 L214 250 L228 200 L242 250 L242 400 Z" fill="#ffcf8a" opacity="0.12" />
      {/* guirnalda de lamparitas */}
      <path d="M0 150 Q100 220 200 170 Q300 120 400 190" fill="none" stroke={K} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const t = i / 11;
        const x = t * 400;
        const y = t < 0.5 ? 150 + Math.sin(t * Math.PI * 2) * 40 + t * 40 : 170 - Math.sin((t - 0.5) * Math.PI * 2) * 40 + (t - 0.5) * 40;
        return (
          <g key={i}>
            <circle cx={x} cy={y + 8} r="6" fill="#ffd98a" />
            <circle cx={x} cy={y + 8} r="16" fill="#ffd98a" opacity="0.18" />
          </g>
        );
      })}
      {/* baranda y piso */}
      <path d="M0 470 L400 470 L400 720 L0 720 Z" fill={K} />
      <rect x="0" y="450" width="400" height="10" fill="#2a2a2a" />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={i * 40} y="460" width="5" height="60" fill="#2a2a2a" />
      ))}
      {/* soga con una sábana */}
      <path d="M260 420 Q320 440 400 420" stroke="#555" strokeWidth="2" fill="none" />
      <path d="M300 430 L350 432 L346 520 L304 516 Z" fill={W} opacity="0.85" />
    </g>
  );
}

/** Sala de ensayo: paredes de cajas de huevo, amplificadores, cables. */
function Ensayo() {
  return (
    <g>
      <rect width="400" height="720" fill="#160d0a" />
      <g fill="#2a1a14">
        {Array.from({ length: 10 }, (_, f) =>
          Array.from({ length: 8 }, (_, c) => <path key={`${f}-${c}`} d={`M${c * 50 + 25} ${f * 50 + 10} l18 18 l-18 18 l-18 -18 z`} />),
        )}
      </g>
      <Rayos color={R} opacity={0.12} />
      {/* foco */}
      <path d="M200 0 L60 560 L340 560 Z" fill="#fff3d6" opacity="0.08" />
      {/* amplificadores */}
      <rect x="20" y="400" width="130" height="160" rx="6" fill={K} stroke="#3a3a3a" strokeWidth="4" />
      <rect x="34" y="420" width="102" height="16" fill="#c9a24a" />
      <circle cx="85" cy="500" r="44" fill="#1a1a1a" stroke="#333" strokeWidth="4" />
      <rect x="260" y="420" width="120" height="140" rx="6" fill={K} stroke="#3a3a3a" strokeWidth="4" />
      <circle cx="320" cy="495" r="38" fill="#1a1a1a" stroke="#333" strokeWidth="4" />
      {/* batería */}
      <ellipse cx="200" cy="470" rx="46" ry="14" fill={R2} stroke={K} strokeWidth="3" />
      <rect x="154" y="470" width="92" height="60" fill={R2} stroke={K} strokeWidth="3" />
      <ellipse cx="200" cy="530" rx="46" ry="14" fill="#5a0610" stroke={K} strokeWidth="3" />
      <path d="M150 400 L250 380" stroke="#c9a24a" strokeWidth="4" />
      <ellipse cx="250" cy="378" rx="36" ry="6" fill="#c9a24a" />
      <path d="M0 560 L400 560 L400 720 L0 720 Z" fill={K} />
      <path d="M40 600 Q120 640 200 600 Q280 560 380 620" stroke="#333" strokeWidth="5" fill="none" />
    </g>
  );
}

/** La guardia del hospital: pasillo de luz blanca, máquina de café. */
function Guardia() {
  return (
    <g>
      <rect width="400" height="720" fill="#cfd8dc" />
      {/* pasillo en perspectiva */}
      <path d="M0 0 L160 260 L240 260 L400 0 Z" fill="#e8eef0" />
      <path d="M0 720 L160 420 L240 420 L400 720 Z" fill="#9fb0b6" />
      <path d="M0 0 L160 260 L160 420 L0 720 Z" fill="#b7c6cb" />
      <path d="M400 0 L240 260 L240 420 L400 720 Z" fill="#aebdc2" />
      <rect x="160" y="260" width="80" height="160" fill="#f5fbff" />
      {/* tubos de luz */}
      {[40, 110, 170, 215].map((y, i) => (
        <rect key={y} x={120 + i * 10} y={y} width={160 - i * 20} height="8" fill={W} />
      ))}
      {/* puertas */}
      <path d="M40 200 L110 290 L110 470 L40 560 Z" fill="#5a8f8a" stroke={K} strokeWidth="3" />
      <path d="M360 200 L290 290 L290 470 L360 560 Z" fill="#5a8f8a" stroke={K} strokeWidth="3" />
      {/* máquina de café */}
      <rect x="250" y="420" width="90" height="200" fill={R} stroke={K} strokeWidth="4" />
      <rect x="262" y="440" width="66" height="60" fill="#222" />
      <rect x="282" y="540" width="26" height="30" fill="#111" />
      <text x="295" y="525" textAnchor="middle" fill={W} fontFamily="Arial Black, sans-serif" fontSize="14">
        CAFÉ
      </text>
      {/* silla de plástico */}
      <path d="M60 600 L130 600 L130 560 L66 560 Z M64 600 L64 660 M126 600 L126 660" fill="#3e6fb0" stroke={K} strokeWidth="4" />
      <path d="M0 690 L400 690" stroke={R} strokeWidth="6" opacity="0.6" />
    </g>
  );
}

/** El cuarto oscuro de Sol: luz roja, fotos colgando de sogas. */
function Oscuro() {
  return (
    <g>
      <rect width="400" height="720" fill="#1a0204" />
      <circle cx="200" cy="80" r="200" fill="#ff1020" opacity="0.22" />
      <circle cx="200" cy="80" r="22" fill="#ff3040" />
      <path d="M200 0 L200 58" stroke={K} strokeWidth="3" />
      {/* sogas con fotos */}
      {[170, 300, 430].map((y, f) => (
        <g key={y}>
          <path d={`M0 ${y} Q200 ${y + 30} 400 ${y}`} stroke="#4a0a10" strokeWidth="2" fill="none" />
          {Array.from({ length: 5 }, (_, i) => {
            const x = 30 + i * 78 + (f % 2) * 20;
            const yy = y + 12 + Math.sin((i / 4) * Math.PI) * 18;
            return (
              <g key={i} transform={`rotate(${((i + f) % 3) - 1} ${x + 26} ${yy})`}>
                <rect x={x} y={yy} width="52" height="66" fill="#f0d8d0" opacity="0.9" />
                <rect x={x + 5} y={yy + 5} width="42" height="48" fill="#3a0a0e" />
                <path d={`M${x + 8} ${yy + 46} L${x + 20} ${yy + 30} L${x + 30} ${yy + 40} L${x + 44} ${yy + 22} L${x + 44} ${yy + 50} L${x + 8} ${yy + 50} Z`} fill="#7a1a20" />
                <rect x={x + 22} y={yy - 6} width="8" height="12" fill={K} />
              </g>
            );
          })}
        </g>
      ))}
      {/* mesada con bandejas */}
      <path d="M0 560 L400 540 L400 720 L0 720 Z" fill={K} />
      {[60, 170, 280].map((x) => (
        <rect key={x} x={x} y="520" width="90" height="24" rx="3" fill="#2a0408" stroke="#5a0a12" strokeWidth="3" />
      ))}
    </g>
  );
}

/** El lago del Paseo del Bosque, de noche: dos cielos. */
function Bosque() {
  return (
    <g>
      <rect width="400" height="720" fill="#060a14" />
      <defs>
        <pattern id="nv-estrellas-b" width="70" height="70" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="18" r="1.3" fill={W} />
          <circle cx="50" cy="44" r="0.9" fill={W} />
        </pattern>
      </defs>
      <rect width="400" height="360" fill="url(#nv-estrellas-b)" opacity="0.8" />
      <circle cx="290" cy="110" r="36" fill="#f3ecd8" />
      <Tilo x={40} y={300} s={1.2} />
      <Tilo x={370} y={290} s={1.1} />
      <Tilo x={200} y={320} s={0.7} />
      {/* el lago, con el cielo repetido */}
      <rect x="0" y="380" width="400" height="340" fill="#0a1426" />
      <ellipse cx="290" cy="470" rx="34" ry="10" fill="#f3ecd8" opacity="0.5" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${30 + i * 45} ${420 + (i % 3) * 40} h${30 + (i % 2) * 20}`} stroke={W} strokeWidth="2" opacity="0.25" />
      ))}
      {/* faroles en la orilla */}
      {[60, 150, 330].map((x) => (
        <g key={x}>
          <rect x={x} y="300" width="5" height="80" fill={K} />
          <circle cx={x + 2.5} cy="298" r="6" fill="#ffd98a" />
          <path d={`M${x + 2.5} 400 l0 120`} stroke="#ffd98a" strokeWidth="4" opacity="0.2" />
        </g>
      ))}
      {/* bote de madera con lamparita */}
      <path d="M110 600 L290 600 L260 640 L140 640 Z" fill="#5a3420" stroke={K} strokeWidth="4" />
      <circle cx="270" cy="586" r="6" fill="#ffd98a" />
      <circle cx="270" cy="586" r="20" fill="#ffd98a" opacity="0.2" />
      <path d="M150 600 L110 560 M250 600 L300 570" stroke="#8a5a3a" strokeWidth="5" />
    </g>
  );
}

/** La oficina de vidrio de Dante, en el piso doce. */
function Oficina() {
  return (
    <g>
      <rect width="400" height="720" fill="#08101e" />
      {/* la ciudad de noche por el ventanal */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 46 - 10} y={260 + ((i * 37) % 120)} width="40" height="400" fill="#0f1a30" />
      ))}
      {Array.from({ length: 50 }, (_, i) => (
        <rect key={i} x={((i * 71) % 390) + 4} y={280 + ((i * 47) % 300)} width="4" height="6" fill="#ffd98a" opacity={0.3 + (i % 4) * 0.15} />
      ))}
      {/* parantes del ventanal */}
      {[0, 130, 260, 390].map((x) => (
        <rect key={x} x={x} y="0" width="10" height="600" fill="#1c2638" />
      ))}
      <rect x="0" y="180" width="400" height="6" fill="#1c2638" />
      <path d="M0 0 L120 0 L0 260 Z" fill={W} opacity="0.05" />
      {/* escritorio y maqueta tapada */}
      <path d="M0 600 L400 560 L400 720 L0 720 Z" fill="#111" />
      <path d="M0 600 L400 560 L400 572 L0 612 Z" fill="#3a4a66" />
      <path d="M230 560 L240 470 L268 440 L300 470 L306 560 Z" fill="#e8e8ea" stroke="#999" strokeWidth="2" />
      <path d="M60 590 L60 548 L98 548 L98 586" fill="none" stroke="#9fd3ff" strokeWidth="3" opacity="0.7" />
    </g>
  );
}

/** Un departamento a la mañana: persiana en rayas de sol, dos tazas. */
function Depto() {
  return (
    <g>
      <rect width="400" height="720" fill="#f3e2c8" />
      {/* ventana con persiana */}
      <rect x="60" y="80" width="280" height="300" fill="#ffe7a8" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="60" y={80 + i * 25} width="280" height="12" fill="#d8b98a" />
      ))}
      <rect x="54" y="74" width="292" height="312" fill="none" stroke="#7a5a3a" strokeWidth="8" />
      {/* rayas de sol en diagonal */}
      <g fill="#fff3c8" opacity="0.5">
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${60 + i * 40} ${380} L${10 + i * 40} 720 L${30 + i * 40} 720 L${80 + i * 40} 380 Z`} />
        ))}
      </g>
      {/* planta */}
      <path d="M330 520 Q310 440 340 400 M340 520 Q360 450 384 430" stroke="#2f7a4a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M314 520 L370 520 L362 580 L322 580 Z" fill={R} />
      {/* mesa con dos tazas */}
      <path d="M0 600 L400 570 L400 720 L0 720 Z" fill="#8a5a3a" />
      <path d="M0 600 L400 570 L400 582 L0 614 Z" fill="#a8744c" />
      {[150, 230].map((x) => (
        <g key={x}>
          <path d={`M${x} 560 L${x + 36} 560 L${x + 32} 600 L${x + 4} 600 Z`} fill={W} stroke={K} strokeWidth="3" />
          <path d={`M${x + 36} 568 q14 4 0 18`} fill="none" stroke={K} strokeWidth="3" />
          <path d={`M${x + 10} 548 q-6 -12 4 -22 M${x + 22} 548 q-6 -12 4 -22`} stroke="#bbb" strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

/** La cabina de Luna: luces rojas y violetas, bandejas, humo. */
function Cabina() {
  return (
    <g>
      <rect width="400" height="720" fill="#12051c" />
      <defs>
        <radialGradient id="nv-cabina-luz" cx="50%" cy="20%" r="80%">
          <stop offset="0" stopColor="#b01fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ff1040" stopOpacity="0.25" />
          <stop offset="1" stopColor="#12051c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="720" fill="url(#nv-cabina-luz)" />
      {/* haces de luz cruzados */}
      <g opacity="0.22">
        <path d="M40 0 L90 0 L300 560 L200 560 Z" fill="#ff2a55" />
        <path d="M360 0 L310 0 L100 560 L200 560 Z" fill="#a43bff" />
        <path d="M200 0 L215 0 L260 560 L150 560 Z" fill={W} opacity="0.5" />
      </g>
      {/* bolas de luz */}
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={(i * 83) % 400} cy={80 + ((i * 47) % 300)} r={3 + (i % 3) * 2} fill={i % 2 ? "#ff3b6b" : "#c77dff"} opacity="0.7" />
      ))}
      {/* la cabina */}
      <path d="M40 520 L360 500 L360 720 L40 720 Z" fill={K} />
      <path d="M40 520 L360 500 L360 512 L40 532 Z" fill="#c77dff" opacity="0.8" />
      {[110, 290].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="545" rx="52" ry="14" fill="#1d1d24" stroke="#444" strokeWidth="3" />
          <ellipse cx={x} cy="543" rx="12" ry="4" fill="#ff3b6b" />
        </g>
      ))}
      <rect x="170" y="528" width="60" height="26" rx="3" fill="#1d1d24" stroke="#444" strokeWidth="2" />
      {[178, 192, 206, 220].map((x, i) => (
        <rect key={x} x={x} y="532" width="6" height="18" fill={i % 2 ? "#c77dff" : "#ff3b6b"} />
      ))}
      {/* humo */}
      <g fill={W} opacity="0.06">
        <ellipse cx="120" cy="470" rx="140" ry="40" />
        <ellipse cx="300" cy="440" rx="120" ry="34" />
      </g>
    </g>
  );
}

/** El Zaguán: el bar de Bruno. Cartel de neón enorme, barra de mármol, nadie adentro. */
function Zaguan() {
  return (
    <g>
      <rect width="400" height="720" fill="#08111f" />
      <Rayos color="#3fd0ff" opacity={0.05} />
      {/* el cartel de neón */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <text x="200" y="190" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="70" stroke="#3fd0ff" strokeWidth="3">
          Zaguán
        </text>
        <text x="200" y="190" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="70" stroke="#3fd0ff" strokeWidth="14" opacity="0.15">
          Zaguán
        </text>
        <path d="M80 220 L320 220" stroke="#ff4fa3" strokeWidth="5" />
        <path d="M80 220 L320 220" stroke="#ff4fa3" strokeWidth="16" opacity="0.15" />
      </g>
      {/* estantes con botellas alineadas, demasiado ordenadas */}
      {[300, 380].map((y) => (
        <g key={y}>
          <rect x="20" y={y} width="360" height="6" fill="#1e2a40" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={30 + i * 29} y={y - 50} width="16" height="50" rx="3" fill={i % 3 ? "#16304a" : "#3fd0ff"} opacity={i % 3 ? 1 : 0.4} />
          ))}
        </g>
      ))}
      {/* barra de mármol */}
      <path d="M0 500 L400 470 L400 720 L0 720 Z" fill="#d9dde3" />
      <path d="M0 500 L400 470 L400 484 L0 514 Z" fill={W} />
      <path d="M40 560 Q120 540 180 600 M240 520 Q300 560 380 540" stroke="#aab0b8" strokeWidth="2" fill="none" />
      {/* banquetas vacías */}
      {[40, 120, 200, 280, 360].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy={630 - i * 4} rx="22" ry="7" fill="#1e2a40" />
          <rect x={x - 3} y={636 - i * 4} width="6" height="70" fill="#1e2a40" />
        </g>
      ))}
    </g>
  );
}

/** Un estudio jurídico viejo: biblioteca de expedientes, lámpara verde. */
function Estudio() {
  return (
    <g>
      <rect width="400" height="720" fill="#1a120c" />
      {/* bibliotecas */}
      {Array.from({ length: 6 }, (_, f) => (
        <g key={f}>
          <rect x="0" y={60 + f * 80} width="400" height="8" fill="#3a2614" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={6 + i * 28} y={60 + f * 80 - (40 + ((i * 7 + f * 3) % 4) * 8)} width="22" height={40 + ((i * 7 + f * 3) % 4) * 8} fill={["#5a1a14", "#2a3a2a", "#3a2a1a", "#6b4a2a"][(i + f) % 4]} />
          ))}
        </g>
      ))}
      <Rayos color="#ffd98a" opacity={0.05} />
      {/* escritorio */}
      <path d="M0 560 L400 540 L400 720 L0 720 Z" fill="#2a180c" />
      <path d="M0 560 L400 540 L400 552 L0 574 Z" fill="#5a3a20" />
      {/* lámpara de banco verde */}
      <path d="M250 540 L250 500" stroke="#c9a24a" strokeWidth="4" />
      <path d="M210 500 Q250 470 290 500 Z" fill="#1f6b45" stroke={K} strokeWidth="3" />
      <path d="M210 500 L150 560 L350 560 L290 500 Z" fill="#ffe7a8" opacity="0.18" />
      {/* pila de expedientes */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={60 + i * 3} y={524 - i * 14} width="110" height="14" fill={i % 2 ? "#e9dfc8" : "#d6c8a8"} stroke="#8a7a5a" strokeWidth="1.5" />
      ))}
    </g>
  );
}

/** La casa a oscuras: velas en la barra, lluvia en la ventana. */
function Velas() {
  return (
    <g>
      <rect width="400" height="720" fill="#0b0605" />
      {/* ventana con lluvia */}
      <rect x="250" y="90" width="120" height="180" fill="#121a24" stroke="#2a2a2a" strokeWidth="6" />
      <g stroke="#7fa6c8" strokeWidth="1.5" opacity="0.5">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M${258 + i * 8} ${96 + (i % 4) * 30} l-4 18`} />
        ))}
      </g>
      {/* botellas en sombra */}
      <Botellas y={300} n={9} alto={70} />
      <rect width="400" height="720" fill="#0b0605" opacity="0.55" />
      {/* barra */}
      <path d="M0 470 L400 410 L400 720 L0 720 Z" fill="#140c08" />
      <path d="M0 470 L400 410 L400 422 L0 484 Z" fill="#4a2a18" />
      {/* velas y sus halos */}
      {[
        [60, 452],
        [140, 440],
        [230, 428],
        [320, 416],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y - 30} r="70" fill="#ffb347" opacity="0.12" />
          <circle cx={x} cy={y - 30} r="28" fill="#ffcf8a" opacity="0.18" />
          <rect x={x - 6} y={y - 26} width="12" height="26" fill="#f3ecd8" />
          <path d={`M${x} ${y - 42} q6 8 0 14 q-6 -6 0 -14 z`} fill="#ffd25e" />
        </g>
      ))}
    </g>
  );
}

const SVGS: Record<FondoId, () => React.JSX.Element> = {
  barra: Barra,
  puerta: Puerta,
  pool: Pool,
  cocina: Cocina,
  vereda: Vereda,
  pasillo: Pasillo,
  plaza: Plaza,
  rana: Rana,
  terraza: Terraza,
  ensayo: Ensayo,
  guardia: Guardia,
  diagonal: Vereda,
  oscuro: Oscuro,
  bosque: Bosque,
  oficina: Oficina,
  depto: Depto,
  cabina: Cabina,
  zaguan: Zaguan,
  estudio: Estudio,
  velas: Velas,
};

/** El fondo dibujado (sin la ilustración): sirve también para componer escenas ilustradas. */
export function FondoSvg({ id }: { id: FondoId }) {
  const Dibujo = SVGS[id];
  return <Dibujo />;
}

export function Fondo({ id }: { id: FondoId }) {
  const img = imagenFondo(id);
  if (img) {
    return (
      <div className={s.foto}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustraciones locales, sin optimizador */}
        <img src={img} alt="" decoding="async" draggable={false} />
        <span className={s.capa} aria-hidden="true" />
      </div>
    );
  }
  return (
    <svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <FondoSvg id={id} />
    </svg>
  );
}
