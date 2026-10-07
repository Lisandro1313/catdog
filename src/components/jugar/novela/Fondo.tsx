import type { Fondo as FondoId } from "@/lib/novela/guion";

/**
 * Fondos de escena en SVG: siluetas negras sobre rojo y gris, rayos de luz en diagonal.
 * Todo determinista (nada de azar): se dibuja igual siempre.
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

export function Fondo({ id }: { id: FondoId }) {
  return (
    <svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {id === "barra" && <Barra />}
      {id === "puerta" && <Puerta />}
      {id === "pool" && <Pool />}
      {id === "cocina" && <Cocina />}
      {id === "vereda" && <Vereda />}
      {id === "pasillo" && <Pasillo />}
      {id === "plaza" && <Plaza />}
    </svg>
  );
}
