import type { Cara, Hablante } from "@/lib/novela/guion";

/**
 * Retratos de la novela, dibujados a mano en SVG: busto en blanco y negro con acentos rojos,
 * a la manera de los recortes de cómic. Todos comparten la cara (ojos, cejas, boca) y cambian
 * pelo, ropa y accesorios. La expresión sale de `cara`.
 */

const K = "#0a0a0a";
const W = "#fbf7f2";
const R = "#e0101e";
const PIEL = "#f6e7dc";
const SOMBRA = "#e5bfb0";

type Quien = Exclude<Hablante, "narra" | "yo">;

function Ojo({ cx, cara, lado }: { cx: number; cara: Cara; lado: -1 | 1 }) {
  const y = 116;
  if (cara === "feliz") return <path d={`M${cx - 10} ${y + 2} Q${cx} ${y - 9} ${cx + 10} ${y + 2}`} fill="none" stroke={K} strokeWidth="4" strokeLinecap="round" />;
  if (cara === "sorpresa")
    return (
      <g>
        <circle cx={cx} cy={y} r="9" fill={W} stroke={K} strokeWidth="3" />
        <circle cx={cx} cy={y} r="3" fill={K} />
      </g>
    );
  // Párpado: cuánto tapa el ojo (serio y pícaro, a medias; enojo, inclinado hacia adentro).
  const media = cara === "serio" || (cara === "picara" && lado === 1);
  const enojo = cara === "enojo";
  const triste = cara === "triste";
  return (
    <g>
      <path d={`M${cx - 11} ${y} Q${cx} ${y - 8} ${cx + 11} ${y} Q${cx} ${y + 7} ${cx - 11} ${y} Z`} fill={W} stroke={K} strokeWidth="2.5" />
      <circle cx={cx + (triste ? 0 : lado * -1)} cy={y + (triste ? 1.5 : 0.5)} r="4.4" fill={K} />
      <circle cx={cx + 1.5} cy={y - 1.5} r="1.2" fill={W} />
      {media && <path d={`M${cx - 12} ${y - 1} L${cx + 12} ${y - 1} L${cx + 12} ${y - 9} L${cx - 12} ${y - 9} Z`} fill={PIEL} stroke={K} strokeWidth="2.5" />}
      {enojo && <path d={`M${cx - 12 * lado} ${y - 9} L${cx + 12 * lado} ${y - 9} L${cx + 12 * lado} ${y - 1} Z`} fill={PIEL} stroke={K} strokeWidth="2" />}
      {triste && <path d={`M${cx - 12 * lado} ${y - 2} L${cx - 12 * lado} ${y - 9} L${cx + 12 * lado} ${y - 9} Z`} fill={PIEL} />}
    </g>
  );
}

function Ceja({ cx, cara, lado }: { cx: number; cara: Cara; lado: -1 | 1 }) {
  const y = 100;
  // lado = 1 → ojo derecho de la imagen; "adentro" es hacia el centro (x = 100).
  const adentro = cx - 13 * lado;
  const afuera = cx + 13 * lado;
  let dy = { a: 0, f: 0 };
  if (cara === "enojo") dy = { a: 7, f: -3 };
  else if (cara === "triste") dy = { a: -6, f: 3 };
  else if (cara === "sorpresa") dy = { a: -7, f: -7 };
  else if (cara === "picara") dy = lado === -1 ? { a: -5, f: -8 } : { a: 2, f: 1 };
  else if (cara === "serio") dy = { a: 3, f: 0 };
  return <path d={`M${adentro} ${y + dy.a} L${afuera} ${y + dy.f}`} stroke={K} strokeWidth="5" strokeLinecap="round" />;
}

function Boca({ cara, labios }: { cara: Cara; labios?: boolean }) {
  const c = labios ? R : K;
  switch (cara) {
    case "feliz":
      return <path d="M86 144 Q100 162 114 144 Z" fill={K} stroke={K} strokeWidth="2.5" strokeLinejoin="round" />;
    case "sonrisa":
      return <path d="M88 146 Q100 154 112 145" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />;
    case "picara":
      return <path d="M89 148 Q102 152 113 141" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />;
    case "triste":
      return <path d="M90 151 Q100 144 110 151" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />;
    case "enojo":
      return <path d="M88 149 L112 147 L110 153 L90 154 Z" fill={W} stroke={K} strokeWidth="2.5" strokeLinejoin="round" />;
    case "sorpresa":
      return <ellipse cx="100" cy="149" rx="6" ry="8" fill={K} />;
    case "serio":
      return <path d="M91 148 L109 148" stroke={c} strokeWidth="3.5" strokeLinecap="round" />;
    default:
      return <path d="M91 147 Q100 151 109 147" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />;
  }
}

/** Cabeza, orejas, cuello: la base de todos. */
function Cabeza({ cara, labios, rubor }: { cara: Cara; labios?: boolean; rubor?: boolean }) {
  return (
    <g>
      <rect x="86" y="150" width="28" height="40" fill={SOMBRA} stroke={K} strokeWidth="3" />
      <ellipse cx="55" cy="120" rx="7" ry="11" fill={PIEL} stroke={K} strokeWidth="3" />
      <ellipse cx="145" cy="120" rx="7" ry="11" fill={PIEL} stroke={K} strokeWidth="3" />
      <path d="M56 104 Q56 58 100 56 Q144 58 144 104 Q144 150 100 170 Q56 150 56 104 Z" fill={PIEL} stroke={K} strokeWidth="3.5" />
      {/* Sombra dura en diagonal, como de cómic */}
      <path d="M128 70 Q144 84 144 104 Q144 150 100 170 Q124 140 128 70 Z" fill={SOMBRA} />
      <path d="M100 124 L96 136 L102 136" fill="none" stroke={K} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {(rubor || cara === "feliz") && (
        <g fill={R} opacity="0.35">
          <ellipse cx="74" cy="136" rx="8" ry="4" />
          <ellipse cx="126" cy="136" rx="8" ry="4" />
        </g>
      )}
      <Ojo cx={80} cara={cara} lado={-1} />
      <Ojo cx={120} cara={cara} lado={1} />
      <Ceja cx={80} cara={cara} lado={-1} />
      <Ceja cx={120} cara={cara} lado={1} />
      <Boca cara={cara} labios={labios} />
      {cara === "triste" && <path d="M126 126 Q128 134 125 138" fill="none" stroke="#7fb7ff" strokeWidth="3" strokeLinecap="round" />}
      {cara === "enojo" && <path d="M146 72 l8 -8 m-4 10 l10 -2 m-12 -4 l2 -10" stroke={R} strokeWidth="3.5" strokeLinecap="round" />}
    </g>
  );
}

const TORSO = "M10 270 Q16 196 100 186 Q184 196 190 270 Z";

function Vera({ cara }: { cara: Cara }) {
  return (
    <g>
      {/* Pelo de atrás: carré */}
      <path d="M46 96 Q44 44 100 40 Q156 44 154 96 L158 168 L132 168 L140 110 L60 110 L68 168 L42 168 Z" fill={K} />
      {/* Campera de cuero */}
      <path d={TORSO} fill={K} stroke={K} strokeWidth="3" />
      <path d="M100 190 L72 270 M100 190 L128 270" stroke={W} strokeWidth="3" />
      <path d="M76 196 L100 230 L124 196" fill={R} stroke={K} strokeWidth="3" />
      <Cabeza cara={cara} labios />
      {/* Flequillo recto */}
      <path d="M52 100 Q50 52 100 48 Q150 52 148 100 L148 96 L52 96 Z" fill={K} />
      <path d="M70 60 L120 54" stroke={W} strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      {/* Aro */}
      <circle cx="146" cy="138" r="7" fill="none" stroke={R} strokeWidth="3" />
    </g>
  );
}

function Teo({ cara }: { cara: Cara }) {
  const rulos = [
    [58, 78], [70, 58], [88, 48], [108, 46], [126, 52], [142, 66], [150, 86], [50, 96], [80, 62], [116, 60], [100, 56], [136, 80],
  ];
  return (
    <g>
      {/* Mango de la guitarra, atrás del hombro */}
      <rect x="150" y="90" width="16" height="140" rx="3" transform="rotate(18 158 160)" fill="#3a2418" stroke={K} strokeWidth="3" />
      <rect x="160" y="70" width="22" height="30" rx="4" transform="rotate(18 171 85)" fill={K} />
      <path d={TORSO} fill="#2b2b2b" stroke={K} strokeWidth="3" />
      {/* Bufanda roja */}
      <path d="M70 186 Q100 204 130 186 L134 200 Q100 218 66 200 Z" fill={R} stroke={K} strokeWidth="3" />
      <path d="M116 206 L124 262 L108 262 L106 210 Z" fill={R} stroke={K} strokeWidth="3" />
      <Cabeza cara={cara} />
      {/* Barba de tres días */}
      <g fill={K} opacity="0.55">
        {[[84, 158], [92, 162], [100, 164], [108, 162], [116, 158], [88, 154], [112, 154], [96, 158], [104, 158]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />
        ))}
      </g>
      {/* Rulos */}
      <g fill={K}>
        {rulos.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="15" />
        ))}
      </g>
      <path d="M78 54 Q86 48 94 52" stroke={W} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

function Mora({ cara }: { cara: Cara }) {
  return (
    <g>
      {/* Taco de pool cruzado */}
      <path d="M18 250 L176 18" stroke="#c8a26a" strokeWidth="8" strokeLinecap="round" />
      <path d="M18 250 L48 206" stroke={K} strokeWidth="9" strokeLinecap="round" />
      <path d="M172 24 L176 18" stroke="#5fb4ff" strokeWidth="9" strokeLinecap="round" />
      {/* Colita alta */}
      <path d="M118 46 Q160 6 170 40 Q178 70 150 96 Q160 60 134 54 Z" fill={K} />
      {/* Ambo */}
      <path d={TORSO} fill="#cfd8dc" stroke={K} strokeWidth="3" />
      <path d="M78 192 L100 226 L122 192" fill="none" stroke={K} strokeWidth="3" />
      <path d="M134 214 h18 v6 h-18 z M140 208 h6 v18 h-6 z" fill={R} />
      <Cabeza cara={cara} />
      {/* Pelo tirante con raya */}
      <path d="M54 104 Q50 50 100 46 Q150 50 146 104 Q140 72 118 64 Q100 76 72 70 Q58 82 54 104 Z" fill={K} />
      <path d="M62 80 Q82 62 112 58" stroke={W} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.8" />
      <rect x="114" y="46" width="12" height="10" rx="3" fill={R} stroke={K} strokeWidth="2" />
    </g>
  );
}

function Abrigo({ cara, revelado }: { cara: Cara; revelado: boolean }) {
  return (
    <g>
      {/* Abrigo con cuello levantado */}
      <path d="M4 270 Q12 190 100 178 Q188 190 196 270 Z" fill="#6f7377" stroke={K} strokeWidth="3" />
      <path d="M58 150 L100 214 L142 150 L150 196 L100 236 L50 196 Z" fill="#8a8f94" stroke={K} strokeWidth="3" />
      <path d="M100 214 L100 270" stroke={K} strokeWidth="3" />
      <rect x="128" y="226" width="5" height="22" fill="#2f8f4f" stroke={K} strokeWidth="1.5" />
      <Cabeza cara={cara} />
      {revelado ? (
        <g>
          {/* Bigote y canas */}
          <path d="M84 140 Q92 134 100 139 Q108 134 116 140 Q108 144 100 141 Q92 144 84 140 Z" fill="#d9d9d9" stroke={K} strokeWidth="2" />
          <path d="M56 104 Q58 86 70 82 L66 112 Z M144 104 Q142 86 130 82 L134 112 Z" fill="#d9d9d9" stroke={K} strokeWidth="2" />
        </g>
      ) : (
        // La sombra del ala tapa la cara: solo brillan los ojos.
        <g>
          <path d="M56 70 L144 70 L146 128 Q100 138 54 128 Z" fill={K} opacity="0.92" />
          <path d="M70 116 l14 -3 M116 113 l14 3" stroke={W} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      {/* Sombrero */}
      <path d="M30 78 Q100 56 170 78 Q100 92 30 78 Z" fill="#3f4246" stroke={K} strokeWidth="3" />
      <path d="M62 74 Q60 30 100 28 Q140 30 138 74 Q100 66 62 74 Z" fill="#4c5055" stroke={K} strokeWidth="3" />
      <path d="M63 64 Q100 56 137 64 L137 72 Q100 64 63 72 Z" fill={K} />
    </g>
  );
}

function Lisandro({ cara }: { cara: Cara }) {
  return (
    <g>
      <path d={TORSO} fill="#f1ede6" stroke={K} strokeWidth="3" />
      {/* Delantal negro y trapo al hombro */}
      <path d="M58 270 L66 206 L134 206 L142 270 Z" fill={K} />
      <path d="M66 206 L84 192 M134 206 L116 192" stroke={K} strokeWidth="5" />
      <path d="M128 190 Q160 186 172 200 L166 236 Q150 226 132 230 Z" fill={W} stroke={K} strokeWidth="3" />
      <path d="M138 202 L162 206 M136 214 L160 218" stroke={R} strokeWidth="3" />
      <Cabeza cara={cara} />
      {/* Barba prolija */}
      <path d="M62 120 Q64 160 100 172 Q136 160 138 120 Q132 150 118 154 Q100 146 82 154 Q68 150 62 120 Z" fill="#2a2420" />
      <path d="M58 98 Q54 52 100 48 Q146 52 142 98 Q134 70 100 66 Q66 70 58 98 Z" fill="#2a2420" />
    </g>
  );
}

function Agustin({ cara }: { cara: Cara }) {
  return (
    <g>
      {/* Chaqueta de cocina cruzada */}
      <path d={TORSO} fill={W} stroke={K} strokeWidth="3" />
      <path d="M100 190 L122 270" stroke={K} strokeWidth="3" />
      <g fill={K}>
        <circle cx="96" cy="214" r="3.5" />
        <circle cx="100" cy="236" r="3.5" />
        <circle cx="104" cy="258" r="3.5" />
        <circle cx="124" cy="214" r="3.5" />
        <circle cx="130" cy="236" r="3.5" />
      </g>
      <Cabeza cara={cara} />
      <path d="M58 96 Q56 66 70 60 L60 108 Z M142 96 Q144 66 130 60 L140 108 Z" fill="#3a2a20" />
      {/* Pañuelo rojo con lunares */}
      <path d="M52 90 Q52 44 100 42 Q148 44 148 90 Q100 74 52 90 Z" fill={R} stroke={K} strokeWidth="3" />
      <g fill={W}>
        <circle cx="76" cy="66" r="3" />
        <circle cx="100" cy="56" r="3" />
        <circle cx="124" cy="66" r="3" />
        <circle cx="88" cy="78" r="2.5" />
        <circle cx="114" cy="76" r="2.5" />
      </g>
      <path d="M146 80 L166 70 L160 92 Z" fill={R} stroke={K} strokeWidth="3" />
    </g>
  );
}

function Gato({ cara }: { cara: Cara }) {
  const ojo = cara === "feliz" ? "cerrado" : "abierto";
  return (
    <g>
      <path d="M150 270 Q190 230 176 190 Q170 176 180 168" fill="none" stroke={K} strokeWidth="14" strokeLinecap="round" />
      <path d="M36 270 Q40 196 100 190 Q160 196 164 270 Z" fill={K} />
      <path d="M44 150 L48 70 L86 108 Z M156 150 L152 70 L114 108 Z" fill={K} />
      <path d="M54 120 L56 86 L76 106 Z M146 120 L144 86 L124 106 Z" fill={R} />
      <ellipse cx="100" cy="146" rx="62" ry="54" fill={K} />
      {ojo === "abierto" ? (
        <g>
          <ellipse cx="76" cy="140" rx="13" ry="15" fill="#f6d33c" />
          <ellipse cx="124" cy="140" rx="13" ry="15" fill="#f6d33c" />
          <ellipse cx="76" cy="140" rx="3.5" ry="12" fill={K} />
          <ellipse cx="124" cy="140" rx="3.5" ry="12" fill={K} />
        </g>
      ) : (
        <path d="M64 142 Q76 132 88 142 M112 142 Q124 132 136 142" stroke="#f6d33c" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      <path d="M95 162 L105 162 L100 168 Z" fill={R} />
      <path d="M60 166 L24 160 M60 172 L26 178 M140 166 L176 160 M140 172 L174 178" stroke={W} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

export function Retrato({ quien, cara }: { quien: Quien; cara: Cara }) {
  return (
    <svg viewBox="0 0 200 270" role="img" aria-label={quien} preserveAspectRatio="xMidYMax meet">
      {quien === "vera" && <Vera cara={cara} />}
      {quien === "teo" && <Teo cara={cara} />}
      {quien === "mora" && <Mora cara={cara} />}
      {quien === "gris" && <Abrigo cara={cara} revelado={false} />}
      {quien === "gervasio" && <Abrigo cara={cara} revelado />}
      {quien === "lisandro" && <Lisandro cara={cara} />}
      {quien === "agustin" && <Agustin cara={cara} />}
      {quien === "gato" && <Gato cara={cara} />}
    </svg>
  );
}
