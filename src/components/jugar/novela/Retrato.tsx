import { useId } from "react";
import type { Cara, Quien } from "@/lib/novela/tipos";
import { imagenRetrato } from "@/lib/novela/arte";
import s from "./Retrato.module.css";

/**
 * Retratos de la novela. Si hay ilustración (public/novela, ver `arte.ts`) se usa esa; si falta la
 * expresión, la normal con un efecto encima (rubor, sombra, sacudón). Si no hay ninguna, se dibuja en
 * SVG: medio cuerpo, a la manera del anime/Persona, con contorno grueso y acentos rojos.
 */

const K = "#0a0a0a";
const W = "#fbf7f2";
const R = "#e0101e";

type Rasgos = {
  piel: string;
  sombra: string;
  iris: string;
  fem?: boolean;
  labios?: string;
  pecas?: boolean;
  /** Barba de unos días (masculino). */
  barba?: string;
};

// ─── La cara ────────────────────────────────────────────────────────────────────────────────

const ABRE: Partial<Record<Cara, number>> = { sorpresa: 1.3, picara: 0.55, guino: 0.9, serio: 0.62, enojo: 0.7, triste: 0.72, sonrojo: 0.8 };

function Ojo({ cx, cy, lado, cara, r, uid }: { cx: number; cy: number; lado: -1 | 1; cara: Cara; r: Rasgos; uid: string }) {
  const w = r.fem ? 11.5 : 10.5;
  const h = r.fem ? 8.5 : 7;
  const inn = cx - lado * w;
  const out = cx + lado * w;
  const cerrado = cara === "feliz" || (cara === "guino" && lado === 1);
  if (cerrado) {
    return (
      <g>
        <path d={`M${inn} ${cy + 1} Q${cx} ${cy - 8} ${out} ${cy + 1}`} stroke={K} strokeWidth="3.2" fill="none" strokeLinecap="round" />
        {r.fem && <path d={`M${out} ${cy + 1} l${lado * 4} -2`} stroke={K} strokeWidth="2.4" strokeLinecap="round" />}
      </g>
    );
  }
  const abre = ABRE[cara] ?? 1;
  const top = cy - h * 1.5 * abre;
  const bot = cy + h * 0.95;
  const outY = cy - (r.fem ? 3.5 : 1.5);
  const forma = `M${inn} ${cy + 1} Q${cx} ${top} ${out} ${outY} Q${cx + lado * 3} ${bot} ${inn} ${cy + 1} Z`;
  const mira = cara === "sonrojo" ? -lado * 2.2 : cara === "picara" ? lado * 1.5 : 0;
  const baja = cara === "sonrojo" || cara === "triste" ? 2 : 0;
  const rIris = cara === "sorpresa" ? 4.6 : 6.4;
  const id = `${uid}o${lado}`;
  return (
    <g>
      <clipPath id={id}>
        <path d={forma} />
      </clipPath>
      <path d={forma} fill={W} />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx + mira} cy={cy + 1.5 + baja} r={rIris} fill={r.iris} />
        <circle cx={cx + mira} cy={cy - 1 + baja} r={rIris} fill={K} opacity="0.35" />
        <circle cx={cx + mira} cy={cy + 1.5 + baja} r={rIris * 0.45} fill={K} />
        <circle cx={cx + mira + 2.2} cy={cy - 1.5 + baja} r="2" fill={W} />
        <circle cx={cx + mira - 2} cy={cy + 4 + baja} r="0.9" fill={W} />
        {/* sombra del párpado */}
        <path d={`M${inn - 2} ${cy - 12} L${out + 2} ${cy - 12} L${out + 2} ${outY + 1.5} Q${cx} ${top + 3.5} ${inn - 2} ${cy + 2.5} Z`} fill={K} opacity="0.18" />
      </g>
      <path d={`M${inn} ${cy + 1} Q${cx} ${top} ${out} ${outY}`} stroke={K} strokeWidth={r.fem ? 3.6 : 3} fill="none" strokeLinecap="round" />
      {r.fem && <path d={`M${out} ${outY} l${lado * 5} -3.5 M${out - lado * 2} ${outY - 1.5} l${lado * 3.5} -4`} stroke={K} strokeWidth="2" strokeLinecap="round" />}
      <path d={`M${inn + lado * 3} ${bot - 1.5} Q${cx} ${bot + 1} ${out - lado * 1} ${outY + 3.5}`} stroke={K} strokeWidth="1.2" fill="none" opacity="0.55" />
    </g>
  );
}

function Ceja({ cx, cy, lado, cara, fem }: { cx: number; cy: number; lado: -1 | 1; cara: Cara; fem?: boolean }) {
  const y = cy - 16;
  const a = cx - lado * 11;
  const f = cx + lado * 12;
  let da = 0;
  let df = 0;
  if (cara === "enojo") [da, df] = [6, -3];
  else if (cara === "triste" || cara === "sonrojo") [da, df] = [-4, 2];
  else if (cara === "sorpresa") [da, df] = [-5, -5];
  else if (cara === "picara" || cara === "guino") [da, df] = lado === -1 ? [-4, -6] : [2, 1];
  else if (cara === "serio") [da, df] = [2.5, 0];
  return <path d={`M${a} ${y + da} Q${cx} ${y - 3 + (da + df) / 2} ${f} ${y + df}`} stroke={K} strokeWidth={fem ? 2.6 : 3.8} fill="none" strokeLinecap="round" />;
}

function Boca({ cara, r }: { cara: Cara; r: Rasgos }) {
  const c = r.labios ?? K;
  const lin = { fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" as const };
  switch (cara) {
    case "feliz":
      return (
        <g>
          <path d="M109 143 Q120 159 131 143 Z" fill="#5b0d16" stroke={K} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M111 144 L129 144" stroke={W} strokeWidth="2" />
        </g>
      );
    case "sonrisa":
      return <path d="M110 144 Q120 152 130 144" {...lin} />;
    case "picara":
    case "guino":
      return <path d="M111 147 Q122 150 130 141" {...lin} />;
    case "triste":
      return <path d="M112 150 Q120 145 128 150" {...lin} />;
    case "enojo":
      return <path d="M110 148 L130 146 L128 152 L112 153 Z" fill={W} stroke={K} strokeWidth="2.2" strokeLinejoin="round" />;
    case "sorpresa":
      return <ellipse cx="120" cy="148" rx="4.5" ry="6" fill="#5b0d16" stroke={K} strokeWidth="2" />;
    case "serio":
      return <path d="M113 147 L127 147" {...lin} />;
    case "sonrojo":
      return <path d="M113 148 q3.5 -2.5 7 0 q3.5 2.5 7 0" {...lin} />;
    default:
      return <path d="M113 146 Q120 149.5 127 146" {...lin} />;
  }
}

function Cara_({ cara, r, uid }: { cara: Cara; r: Rasgos; uid: string }) {
  const rostro = r.fem
    ? "M88 96 Q86 138 104 158 Q113 168 120 169 Q127 168 136 158 Q154 138 152 96 Q150 62 120 60 Q90 62 88 96 Z"
    : "M86 94 Q85 136 99 156 Q110 169 120 171 Q130 169 141 156 Q155 136 154 94 Q152 58 120 56 Q88 58 86 94 Z";
  const rubor = cara === "sonrojo" || cara === "feliz" || cara === "guino" || cara === "picara";
  return (
    <g>
      {/* cuello y orejas */}
      <path d="M106 150 L106 192 Q120 200 134 192 L134 150 Z" fill={r.sombra} stroke={K} strokeWidth="3" />
      <path d="M106 160 Q120 176 134 160 L134 170 Q120 184 106 170 Z" fill={K} opacity="0.18" />
      <ellipse cx="87" cy="114" rx="6" ry="10" fill={r.piel} stroke={K} strokeWidth="2.6" />
      <ellipse cx="153" cy="114" rx="6" ry="10" fill={r.piel} stroke={K} strokeWidth="2.6" />
      <path d={rostro} fill={r.piel} stroke={K} strokeWidth="3.2" />
      {/* sombra dura de costado, de cómic */}
      <path d="M140 72 Q152 84 152 98 Q152 138 136 158 Q127 167 121 169 Q140 140 140 72 Z" fill={r.sombra} opacity="0.85" />
      {r.barba && <path d="M90 124 Q92 156 110 166 Q120 172 130 166 Q148 156 150 124 Q144 150 128 154 Q120 150 112 154 Q96 150 90 124 Z" fill={r.barba} opacity="0.55" />}
      {r.pecas && (
        <g fill="#b0603e" opacity="0.6">
          {[[100, 128], [104, 131], [108, 127], [132, 127], [136, 131], [140, 128], [118, 125], [122, 125]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />
          ))}
        </g>
      )}
      {/* nariz */}
      <path d="M121 120 L117 134 L123 134" fill="none" stroke={K} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {rubor && (
        <g>
          <ellipse cx="100" cy="133" rx="9" ry="4.5" fill={R} opacity={cara === "sonrojo" ? 0.42 : 0.2} />
          <ellipse cx="140" cy="133" rx="9" ry="4.5" fill={R} opacity={cara === "sonrojo" ? 0.42 : 0.2} />
          {cara === "sonrojo" && <path d="M94 136 l4 -6 M99 136 l4 -6 M104 136 l4 -6 M134 136 l4 -6 M139 136 l4 -6 M144 136 l4 -6" stroke={R} strokeWidth="1.6" strokeLinecap="round" />}
        </g>
      )}
      <Ojo cx={104} cy={114} lado={-1} cara={cara} r={r} uid={uid} />
      <Ojo cx={136} cy={114} lado={1} cara={cara} r={r} uid={uid} />
      <Ceja cx={104} cy={114} lado={-1} cara={cara} fem={r.fem} />
      <Ceja cx={136} cy={114} lado={1} cara={cara} fem={r.fem} />
      <Boca cara={cara} r={r} />
      {cara === "triste" && <path d="M142 122 Q145 132 141 138" fill="none" stroke="#7fb7ff" strokeWidth="3" strokeLinecap="round" />}
      {cara === "enojo" && <path d="M160 70 l7 -7 m-3 9 l9 -2 m-11 -4 l2 -9" stroke={R} strokeWidth="3.2" strokeLinecap="round" />}
      {cara === "sorpresa" && <path d="M158 82 q6 8 0 12 q-6 -4 0 -12 z" fill="#9fd3ff" stroke={K} strokeWidth="1.6" />}
    </g>
  );
}

// ─── Cuerpos ────────────────────────────────────────────────────────────────────────────────

/** Torso de medio cuerpo, hombros anchos o angostos. */
const torso = (ancho: number) => `M${120 - ancho} 330 L${126 - ancho} 236 Q${132 - ancho} 198 ${172 - ancho} 188 L120 198 L${68 + ancho} 188 Q${108 + ancho} 198 ${114 + ancho} 236 L${120 + ancho} 330 Z`;
const brazoIzq = (ancho: number, color: string) => <path d={`M${126 - ancho} 236 Q${112 - ancho} 286 ${118 - ancho} 330 L${150 - ancho} 330 Q${146 - ancho} 290 ${152 - ancho} 250 Z`} fill={color} stroke={K} strokeWidth="3" />;
const brazoDer = (ancho: number, color: string) => <path d={`M${114 + ancho} 236 Q${128 + ancho} 286 ${122 + ancho} 330 L${90 + ancho} 330 Q${94 + ancho} 290 ${88 + ancho} 250 Z`} fill={color} stroke={K} strokeWidth="3" />;

function Brillo({ d }: { d: string }) {
  return <path d={d} stroke={W} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />;
}

type Figura = { cara: Cara; noche?: boolean; uid: string };

function Vera({ cara, noche, uid }: Figura) {
  const r: Rasgos = { piel: "#f6e2d6", sombra: "#e2bfae", iris: "#5a4636", fem: true, labios: "#b3122a" };
  return (
    <g>
      <path d="M78 98 Q74 44 120 40 Q166 44 162 98 L166 176 Q150 184 140 170 L146 116 L94 116 L100 170 Q90 184 74 176 Z" fill={K} />
      {noche ? (
        <g>
          <path d={torso(98)} fill="#141414" stroke={K} strokeWidth="3" />
          <path d="M96 192 Q120 214 144 192 L150 330 L90 330 Z" fill="#2a2a2a" />
          {/* campera de cuero abierta encima */}
          <path d="M22 330 L30 236 Q38 198 78 188 L104 196 L96 330 Z" fill={K} />
          <path d="M218 330 L210 236 Q202 198 162 188 L136 196 L144 330 Z" fill={K} />
          <path d="M80 190 L98 238 M160 190 L142 238" stroke="#4a4a4a" strokeWidth="2.5" />
          {brazoIzq(98, K)}
          {brazoDer(98, K)}
        </g>
      ) : (
        <g>
          <path d={torso(96)} fill="#1b1b1b" stroke={K} strokeWidth="3" />
          {/* cuello de camisa y delantal de bartender */}
          <path d="M104 190 L114 214 L120 198 L126 214 L136 190" fill="#2b2b2b" stroke={K} strokeWidth="2.5" />
          <path d="M84 236 L156 236 L162 330 L78 330 Z" fill="#3a2e28" stroke={K} strokeWidth="3" />
          <path d="M84 236 L100 196 M156 236 L140 196" stroke="#3a2e28" strokeWidth="5" />
          <rect x="104" y="262" width="32" height="24" fill="none" stroke="#5c4a40" strokeWidth="2.5" />
          {brazoIzq(96, "#1b1b1b")}
          {brazoDer(96, "#1b1b1b")}
          {/* coctelera en la mano */}
          <g transform="rotate(-14 196 270)">
            <rect x="186" y="236" width="22" height="46" rx="5" fill="#c9cdd2" stroke={K} strokeWidth="2.5" />
            <rect x="190" y="226" width="14" height="12" rx="3" fill="#aab0b6" stroke={K} strokeWidth="2.5" />
            <path d="M191 244 L191 276" stroke={W} strokeWidth="3" opacity="0.8" />
          </g>
          <ellipse cx="200" cy="284" rx="12" ry="9" fill={r.piel} stroke={K} strokeWidth="2.5" />
        </g>
      )}
      <path d="M108 194 Q120 200 132 194" stroke={R} strokeWidth="4" fill="none" />
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* flequillo recto con mechón rojo */}
      <path d="M82 104 Q78 48 120 46 Q162 48 158 104 L152 100 L150 86 L132 98 L128 84 L112 98 L106 84 L92 98 L88 88 Z" fill={K} />
      <path d="M128 50 Q146 58 150 88 L142 92 Q138 66 124 54 Z" fill="#8e0f1c" />
      <Brillo d="M96 60 Q110 52 126 54" />
      <circle cx="152" cy="132" r="6" fill="none" stroke="#d8d8d8" strokeWidth="2.4" />
      <circle cx="88" cy="128" r="2.4" fill="#d8d8d8" />
    </g>
  );
}

function Teo({ cara, noche, uid }: Figura) {
  const r: Rasgos = { piel: "#ecc4a2", sombra: "#d3a07c", iris: "#3d2a1a", barba: "#3b2a1e" };
  const rulos = [[84, 86], [90, 64], [104, 50], [120, 44], [138, 48], [152, 62], [158, 84], [80, 104], [98, 60], [140, 60], [120, 54], [154, 104], [110, 46], [130, 46]];
  return (
    <g>
      {/* mástil de la guitarra atrás del hombro */}
      <g transform="rotate(22 190 170)">
        <rect x="182" y="70" width="16" height="200" rx="3" fill="#4a2d1c" stroke={K} strokeWidth="3" />
        <rect x="178" y="44" width="24" height="34" rx="4" fill={K} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="178" cy={52 + i * 10} r="3" fill="#d8c7a0" />
        ))}
      </g>
      <g fill={K}>
        {rulos.map(([x, y]) => (
          <circle key={`b${x}-${y}`} cx={x} cy={y} r="16" />
        ))}
      </g>
      <path d={torso(100)} fill={noche ? "#111" : "#f1ede6"} stroke={K} strokeWidth="3" />
      {/* camisa abierta en el cuello */}
      <path d="M100 190 L120 232 L140 190 L134 188 L120 214 L106 188 Z" fill="#d3a07c" stroke={K} strokeWidth="2.5" />
      <path d="M98 188 L88 214 L112 206 Z M142 188 L152 214 L128 206 Z" fill={noche ? "#222" : W} stroke={K} strokeWidth="2.5" />
      <path d="M120 232 L120 330" stroke={K} strokeWidth="2" opacity="0.5" />
      {!noche && (
        <g>
          {/* bufanda roja suelta */}
          <path d="M92 196 Q100 230 94 280 L108 282 Q112 236 104 200 Z" fill={R} stroke={K} strokeWidth="2.5" />
        </g>
      )}
      {/* correa de la guitarra cruzada */}
      <path d="M150 190 L80 330" stroke={noche ? "#5a1018" : "#3a2418"} strokeWidth="12" />
      {brazoIzq(100, noche ? "#111" : "#f1ede6")}
      {brazoDer(100, noche ? "#111" : "#f1ede6")}
      <Cara_ cara={cara} r={r} uid={uid} />
      <g fill={K}>
        {[[92, 72], [106, 62], [122, 58], [138, 62], [150, 74], [100, 80], [140, 82]].map(([x, y]) => (
          <circle key={`f${x}-${y}`} cx={x} cy={y} r="13" />
        ))}
      </g>
      <path d="M104 84 Q112 100 106 108 M134 86 Q130 98 138 106" stroke={K} strokeWidth="6" strokeLinecap="round" fill="none" />
      <Brillo d="M98 58 Q106 52 114 54" />
      <Brillo d="M130 54 Q138 54 144 60" />
    </g>
  );
}

function Mora({ cara, noche, uid }: Figura) {
  const r: Rasgos = { piel: "#c98e6a", sombra: "#a86d4c", iris: "#2a1a10", fem: true, labios: "#8a2030" };
  return (
    <g>
      {/* taco cruzado */}
      <path d="M30 330 L214 30" stroke="#c8a26a" strokeWidth="7" strokeLinecap="round" />
      <path d="M30 330 L64 274" stroke={K} strokeWidth="8" strokeLinecap="round" />
      <path d="M210 36 L214 30" stroke="#5fb4ff" strokeWidth="8" strokeLinecap="round" />
      {/* colita alta con volumen */}
      <path d="M134 50 Q186 0 196 52 Q204 96 172 128 Q186 84 160 70 Z" fill={K} />
      <path d="M150 40 Q178 22 186 48" stroke={W} strokeWidth="3" fill="none" opacity="0.6" />
      {noche ? (
        <g>
          {/* vestido rojo de cuello alto, sin mangas */}
          <path d={torso(94)} fill={R} stroke={K} strokeWidth="3" />
          <path d="M104 188 Q120 196 136 188 L134 200 Q120 206 106 200 Z" fill="#a00c18" stroke={K} strokeWidth="2.5" />
          {brazoIzq(94, r.piel)}
          {brazoDer(94, r.piel)}
          <path d="M60 300 L76 300 M164 300 L180 300" stroke={K} strokeWidth="2" opacity="0.4" />
        </g>
      ) : (
        <g>
          {/* ambo y buzo abierto */}
          <path d={torso(96)} fill="#5a8f8a" stroke={K} strokeWidth="3" />
          <path d="M100 192 L120 226 L140 192" fill="none" stroke={K} strokeWidth="3" />
          <path d="M24 330 L30 236 Q38 198 78 188 L98 194 L92 330 Z" fill="#2b2b33" />
          <path d="M216 330 L210 236 Q202 198 162 188 L142 194 L148 330 Z" fill="#2b2b33" />
          {brazoIzq(96, "#2b2b33")}
          {brazoDer(96, "#2b2b33")}
          <path d="M148 250 h16 v5 h-16 z M153.5 244.5 h5 v16 h-5 z" fill={R} />
        </g>
      )}
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* pelo tirante con raya y mechones sueltos */}
      <path d="M84 104 Q80 46 120 44 Q160 46 156 104 Q150 74 132 66 Q118 78 100 70 Q88 80 84 104 Z" fill={K} />
      <path d="M86 98 Q82 118 88 134 M154 98 Q160 118 152 134" stroke={K} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Brillo d="M94 72 Q110 56 132 56" />
      <rect x="132" y="44" width="14" height="10" rx="3" fill={R} stroke={K} strokeWidth="2" />
    </g>
  );
}

function Dante({ cara, noche, uid }: Figura) {
  const r: Rasgos = { piel: "#e2b48f", sombra: "#c4936e", iris: "#3a5a3a", barba: "#2a1d14" };
  return (
    <g>
      <path d={torso(104)} fill={W} stroke={K} strokeWidth="3" />
      {/* camisa blanca abierta en el cuello */}
      <path d="M102 188 L120 230 L138 188 L132 186 L120 212 L108 186 Z" fill={r.sombra} stroke={K} strokeWidth="2.5" />
      <path d="M100 186 L90 212 L114 204 Z M140 186 L150 212 L126 204 Z" fill={W} stroke={K} strokeWidth="2.5" />
      <g fill={K}>
        <circle cx="120" cy="250" r="2.2" />
        <circle cx="120" cy="278" r="2.2" />
        <circle cx="120" cy="306" r="2.2" />
      </g>
      {noche ? (
        <g>
          {/* mangas arremangadas, sin saco */}
          {brazoIzq(104, W)}
          {brazoDer(104, W)}
          <path d="M24 300 L50 300 M190 300 L216 300" stroke={K} strokeWidth="5" />
          <rect x="196" y="312" width="16" height="10" rx="2" fill="#c9a24a" stroke={K} strokeWidth="2" />
        </g>
      ) : (
        <g>
          {/* saco azul abierto */}
          <path d="M16 330 L24 236 Q32 196 76 186 L102 192 L112 250 L100 330 Z" fill="#1d2b4f" stroke={K} strokeWidth="3" />
          <path d="M224 330 L216 236 Q208 196 164 186 L138 192 L128 250 L140 330 Z" fill="#1d2b4f" stroke={K} strokeWidth="3" />
          <path d="M76 186 L104 238 L92 246 Z M164 186 L136 238 L148 246 Z" fill="#162240" stroke={K} strokeWidth="2.5" />
          <path d="M150 262 l14 -3" stroke={W} strokeWidth="3" />
          {brazoIzq(104, "#1d2b4f")}
          {brazoDer(104, "#1d2b4f")}
        </g>
      )}
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* pelo peinado para atrás, con un mechón rebelde */}
      <path d="M84 102 Q78 50 118 42 Q160 40 158 100 Q154 76 142 68 Q124 62 104 66 Q90 74 84 102 Z" fill="#2a1d14" stroke={K} strokeWidth="2.5" />
      <path d="M100 62 Q120 50 150 66 M96 74 Q120 60 148 78" stroke="#4a3526" strokeWidth="3" fill="none" />
      <path d="M112 64 Q100 84 108 100 Q104 82 118 70 Z" fill="#2a1d14" stroke={K} strokeWidth="2" />
      <Brillo d="M108 52 Q126 46 142 54" />
    </g>
  );
}

function Sol({ cara, noche, uid }: Figura) {
  const r: Rasgos = { piel: "#f3d9c6", sombra: "#ddb59c", iris: "#4f7a3a", fem: true, labios: "#a8323e", pecas: true };
  return (
    <g>
      <path d="M84 100 Q80 54 120 50 Q162 54 156 104 L154 140 L86 140 Z" fill="#141414" />
      <path d={torso(94)} fill="#161616" stroke={K} strokeWidth="3" />
      {noche ? (
        <g>
          {/* campera de cuero roja */}
          <path d="M24 330 L30 236 Q38 198 78 188 L100 194 L94 330 Z" fill="#a30d1a" stroke={K} strokeWidth="3" />
          <path d="M216 330 L210 236 Q202 198 162 188 L140 194 L146 330 Z" fill="#a30d1a" stroke={K} strokeWidth="3" />
          <path d="M80 190 L98 230 M160 190 L142 230" stroke="#6b0710" strokeWidth="3" />
          {brazoIzq(94, "#a30d1a")}
          {brazoDer(94, "#a30d1a")}
        </g>
      ) : (
        <g>
          {/* campera de jean con parches */}
          <path d="M24 330 L30 236 Q38 198 78 188 L100 194 L94 330 Z" fill="#3e5f8a" stroke={K} strokeWidth="3" />
          <path d="M216 330 L210 236 Q202 198 162 188 L140 194 L146 330 Z" fill="#3e5f8a" stroke={K} strokeWidth="3" />
          <circle cx="62" cy="262" r="10" fill={R} stroke={K} strokeWidth="2" />
          <path d="M56 262 l6 -6 l6 6 l-6 6 z" fill={W} />
          <rect x="166" y="282" width="20" height="14" rx="2" fill="#f2c230" stroke={K} strokeWidth="2" transform="rotate(8 176 289)" />
          <path d="M44 236 h12 M48 248 h10" stroke="#9db6d6" strokeWidth="2" />
          {brazoIzq(94, "#3e5f8a")}
          {brazoDer(94, "#3e5f8a")}
        </g>
      )}
      {/* cámara de rollo colgada */}
      <path d="M96 194 L104 254 M144 194 L136 254" stroke="#5a3b26" strokeWidth="4" />
      <rect x="96" y="250" width="48" height="30" rx="4" fill="#222" stroke={K} strokeWidth="2.5" />
      <rect x="96" y="250" width="48" height="9" fill="#c9cdd2" stroke={K} strokeWidth="2" />
      <circle cx="120" cy="268" r="10" fill="#111" stroke="#c9cdd2" strokeWidth="2.5" />
      <circle cx="117" cy="265" r="3" fill={W} opacity="0.6" />
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* aro en la nariz */}
      <path d="M117 135 Q120 140 123 135" stroke="#d8d8d8" strokeWidth="1.8" fill="none" />
      {/* pelo corto despeinado, mechón verde */}
      <path d="M82 108 Q76 50 120 46 Q166 48 160 106 L154 96 L150 78 L140 92 L134 72 L120 90 L112 70 L102 92 L96 76 L90 98 Z" fill="#141414" />
      <path d="M134 50 Q156 56 158 92 L150 86 L148 70 L140 84 Z" fill="#2fbf6a" />
      <Brillo d="M94 64 Q108 54 124 54" />
      <circle cx="152" cy="132" r="2.4" fill="#d8d8d8" />
      <circle cx="152" cy="140" r="2" fill="#d8d8d8" />
    </g>
  );
}

function Amalia({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#ebc8ad", sombra: "#cfa68a", iris: "#4b3a2a", fem: true, labios: "#9a4a52" };
  return (
    <g>
      <path d={torso(94)} fill="#6b3b4a" stroke={K} strokeWidth="3" />
      {/* cárdigan y pañuelo */}
      <path d="M100 192 L120 250 L140 192" fill="#e9dfd1" stroke={K} strokeWidth="2.5" />
      <path d="M96 190 Q120 210 144 190 L150 204 Q120 226 90 204 Z" fill="#d9a441" stroke={K} strokeWidth="2.5" />
      <path d="M112 214 L106 256 L118 252 Z" fill="#d9a441" stroke={K} strokeWidth="2" />
      {brazoIzq(94, "#6b3b4a")}
      {brazoDer(94, "#6b3b4a")}
      <Cara_ cara={cara} r={r} uid={uid} />
      <path d="M96 140 Q100 144 104 141 M136 141 Q140 144 144 140" stroke={K} strokeWidth="1.2" opacity="0.4" fill="none" />
      {/* carré corto, gris */}
      <path d="M82 120 Q74 50 120 48 Q166 50 158 120 L150 132 Q154 90 140 74 Q120 84 98 74 Q86 92 90 132 Z" fill="#a9a9ad" stroke={K} strokeWidth="2.5" />
      <Brillo d="M98 62 Q116 54 136 60" />
      {/* anteojos en la cabeza */}
      <g fill="none" stroke={K} strokeWidth="2.4">
        <circle cx="106" cy="58" r="8" />
        <circle cx="134" cy="58" r="8" />
        <path d="M114 58 L126 58" />
      </g>
    </g>
  );
}

/** Luna: rubia platinada con raíces oscuras, choker, top negro sin hombros, auriculares de colores. */
function Luna({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#f4dccc", sombra: "#dcb8a4", iris: "#6a4a8a", fem: true, labios: "#a0204a" };
  return (
    <g>
      {/* pelo largo platinado, por detrás */}
      <path d="M76 100 Q70 40 120 38 Q170 40 164 100 L172 210 Q150 220 140 196 L144 120 L96 120 L100 196 Q90 220 68 210 Z" fill="#efe6c8" stroke={K} strokeWidth="2.5" />
      <path d={torso(94)} fill="#141414" stroke={K} strokeWidth="3" />
      {/* hombros al aire: el top empieza más abajo */}
      <path d="M52 236 Q120 222 188 236 L190 250 Q120 238 50 250 Z" fill={r.piel} stroke={K} strokeWidth="2.5" />
      {brazoIzq(94, "#141414")}
      {brazoDer(94, "#141414")}
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* choker */}
      <rect x="106" y="176" width="28" height="7" rx="2" fill={K} />
      <circle cx="120" cy="186" r="3" fill="#c77dff" />
      {/* flequillo platinado con raíces oscuras */}
      <path d="M82 106 Q78 48 120 44 Q162 48 158 106 L150 92 L138 104 L132 84 L118 100 L108 82 L96 102 L90 88 Z" fill="#efe6c8" stroke={K} strokeWidth="2" />
      <path d="M92 58 Q120 44 148 58 Q120 52 92 66 Z" fill="#5a4636" />
      {/* auriculares de colores */}
      <path d="M78 110 Q78 30 120 28 Q162 30 162 110" fill="none" stroke={K} strokeWidth="7" />
      <rect x="66" y="98" width="18" height="30" rx="7" fill="#c77dff" stroke={K} strokeWidth="2.5" />
      <rect x="156" y="98" width="18" height="30" rx="7" fill="#ff3b6b" stroke={K} strokeWidth="2.5" />
    </g>
  );
}

/** Bruno: musculoso, remera negra ajustada, antebrazos tatuados, barba prolija. */
function Bruno({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#dba882", sombra: "#bb8862", iris: "#3a2a1a", barba: "#2a1a10" };
  return (
    <g>
      <path d={torso(112)} fill="#151515" stroke={K} strokeWidth="3" />
      <path d="M104 188 Q120 196 136 188" stroke="#333" strokeWidth="3" fill="none" />
      {/* brazos anchos, piel al aire con tatuajes */}
      {brazoIzq(112, r.piel)}
      {brazoDer(112, r.piel)}
      <g stroke="#2b3a6a" strokeWidth="2.2" fill="none" opacity="0.85">
        <circle cx="30" cy="280" r="9" />
        <path d="M24 300 l12 0 l-6 14 z M26 262 l8 -8" />
        <path d="M206 276 l10 0 l-2 18 l-6 0 z M204 304 q8 -6 14 0" />
      </g>
      <Cara_ cara={cara} r={r} uid={uid} />
      {/* barba prolija y pelo corto con jopo */}
      <path d="M90 124 Q92 162 120 172 Q148 162 150 124 Q144 154 130 158 Q120 152 110 158 Q96 154 90 124 Z" fill="#2a1a10" />
      <path d="M86 98 Q82 54 120 50 Q160 52 156 98 Q150 72 132 66 Q140 56 124 52 Q100 60 92 76 Z" fill="#2a1a10" stroke={K} strokeWidth="2" />
      <Brillo d="M104 58 Q118 52 134 56" />
    </g>
  );
}

/** Cami: pelo castaño ondulado medio desarmado, anteojos en la cabeza, blusa blanca, blazer flojo. */
function Cami({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#f0d2bc", sombra: "#d6b29a", iris: "#4a3a2a", fem: true, labios: "#a24a4a" };
  const ondas = [[82, 120], [80, 150], [86, 176], [158, 120], [160, 150], [154, 176]];
  return (
    <g>
      <g fill="#6b4226">
        {ondas.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="16" />
        ))}
      </g>
      <path d={torso(96)} fill={W} stroke={K} strokeWidth="3" />
      <path d="M104 190 L120 222 L136 190" fill="none" stroke={K} strokeWidth="2.5" />
      {/* blazer flojo */}
      <path d="M22 330 L30 236 Q38 198 80 188 L104 196 L110 260 L98 330 Z" fill="#3b3a48" stroke={K} strokeWidth="3" />
      <path d="M218 330 L210 236 Q202 198 160 188 L136 196 L130 260 L142 330 Z" fill="#3b3a48" stroke={K} strokeWidth="3" />
      {brazoIzq(96, "#3b3a48")}
      {brazoDer(96, "#3b3a48")}
      {/* copa de vino */}
      <g transform="translate(184 238)">
        <path d="M0 0 L24 0 Q24 22 12 24 Q0 22 0 0 Z" fill="#7a0f24" opacity="0.85" stroke={K} strokeWidth="2" />
        <path d="M12 24 L12 44 M4 44 L20 44" stroke={K} strokeWidth="2.5" />
      </g>
      <Cara_ cara={cara} r={r} uid={uid} />
      <path d="M84 108 Q78 50 120 46 Q164 50 156 108 Q150 80 134 72 Q122 86 104 76 Q92 86 84 108 Z" fill="#6b4226" stroke={K} strokeWidth="2" />
      <path d="M98 70 q8 18 -2 34 M144 74 q-6 16 4 30" stroke="#6b4226" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* anteojos en la cabeza */}
      <g fill="none" stroke={K} strokeWidth="2.6">
        <rect x="96" y="50" width="18" height="12" rx="4" />
        <rect x="126" y="50" width="18" height="12" rx="4" />
        <path d="M114 56 L126 56" />
      </g>
    </g>
  );
}

/** Evelyn: campera de cuero, top negro, pelo suelto, labios rojos. */
function Evelyn({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#e6bc9c", sombra: "#c99a7a", iris: "#3a2418", fem: true, labios: "#c0102a" };
  return (
    <g>
      <path d="M80 100 Q74 44 120 40 Q166 44 160 100 L168 196 Q150 206 140 184 L146 118 L94 118 L100 184 Q90 206 72 196 Z" fill="#2a1810" />
      <path d={torso(94)} fill="#121212" stroke={K} strokeWidth="3" />
      {/* campera de cuero abierta */}
      <path d="M22 330 L30 236 Q38 198 78 188 L100 194 L94 330 Z" fill="#1b1b1b" stroke={K} strokeWidth="3" />
      <path d="M218 330 L210 236 Q202 198 162 188 L140 194 L146 330 Z" fill="#1b1b1b" stroke={K} strokeWidth="3" />
      <path d="M80 190 L96 232 M160 190 L144 232" stroke="#555" strokeWidth="2.5" />
      <path d="M60 258 L66 300 M180 258 L174 300" stroke="#9a9a9a" strokeWidth="2" />
      {brazoIzq(94, "#1b1b1b")}
      {brazoDer(94, "#1b1b1b")}
      <Cara_ cara={cara} r={r} uid={uid} />
      <path d="M84 104 Q80 48 120 46 Q162 48 156 104 Q146 70 124 64 Q104 74 92 70 Q86 84 84 104 Z" fill="#2a1810" />
      <Brillo d="M98 58 Q114 50 132 54" />
      <circle cx="88" cy="132" r="3" fill="#d8d8d8" />
      <circle cx="152" cy="132" r="3" fill="#d8d8d8" />
    </g>
  );
}

function Abrigo({ cara, revelado, uid }: Figura & { revelado: boolean }) {
  const r: Rasgos = { piel: "#efd5c4", sombra: "#d2b09c", iris: "#6f8fa8" };
  return (
    <g>
      <path d="M8 330 L18 230 Q30 192 120 178 Q210 192 222 230 L232 330 Z" fill="#6f7377" stroke={K} strokeWidth="3" />
      <path d="M76 150 L120 222 L164 150 L174 204 L120 248 L66 204 Z" fill="#8a8f94" stroke={K} strokeWidth="3" />
      <path d="M120 222 L120 330" stroke={K} strokeWidth="3" />
      <rect x="150" y="238" width="5" height="24" fill="#2f8f4f" stroke={K} strokeWidth="1.5" />
      <Cara_ cara={cara} r={r} uid={uid} />
      {revelado ? (
        <g>
          <path d="M104 140 Q112 133 120 138 Q128 133 136 140 Q128 145 120 141 Q112 145 104 140 Z" fill="#d9d9d9" stroke={K} strokeWidth="2" />
          <path d="M86 104 Q88 84 100 80 L96 112 Z M154 104 Q152 84 140 80 L144 112 Z" fill="#d9d9d9" stroke={K} strokeWidth="2" />
        </g>
      ) : (
        <g>
          <path d="M84 70 L156 70 L158 130 Q120 142 82 130 Z" fill={K} opacity="0.93" />
          <path d="M94 116 l14 -3 M132 113 l14 3" stroke={W} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
      <path d="M48 78 Q120 54 192 78 Q120 94 48 78 Z" fill="#3f4246" stroke={K} strokeWidth="3" />
      <path d="M82 74 Q80 28 120 26 Q160 28 158 74 Q120 66 82 74 Z" fill="#4c5055" stroke={K} strokeWidth="3" />
      <path d="M83 64 Q120 56 157 64 L157 72 Q120 64 83 72 Z" fill={K} />
    </g>
  );
}

function Lisandro({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#f2d6c4", sombra: "#d9b6a0", iris: "#3a2a20", barba: "#2a2420" };
  return (
    <g>
      <path d={torso(100)} fill="#f1ede6" stroke={K} strokeWidth="3" />
      <path d="M78 330 L86 232 L154 232 L162 330 Z" fill={K} />
      <path d="M86 232 L102 196 M154 232 L138 196" stroke={K} strokeWidth="5" />
      {brazoIzq(100, "#f1ede6")}
      {brazoDer(100, "#f1ede6")}
      {/* trapo al hombro */}
      <path d="M148 192 Q182 188 194 204 L188 242 Q170 232 152 236 Z" fill={W} stroke={K} strokeWidth="3" />
      <path d="M158 206 L184 210 M156 218 L182 222" stroke={R} strokeWidth="3" />
      <Cara_ cara={cara} r={r} uid={uid} />
      <path d="M90 122 Q92 160 120 172 Q148 160 150 122 Q144 152 132 156 Q120 148 108 156 Q96 152 90 122 Z" fill="#2a2420" />
      <path d="M86 100 Q82 50 120 46 Q158 50 154 100 Q146 70 120 66 Q94 70 86 100 Z" fill="#2a2420" />
      <Brillo d="M100 56 Q114 50 130 52" />
    </g>
  );
}

function Agustin({ cara, uid }: Figura) {
  const r: Rasgos = { piel: "#efcbb0", sombra: "#d4aa8e", iris: "#3a2a20" };
  return (
    <g>
      <path d={torso(100)} fill={W} stroke={K} strokeWidth="3" />
      <path d="M120 196 L144 330" stroke={K} strokeWidth="3" />
      <g fill={K}>
        <circle cx="116" cy="226" r="3.5" />
        <circle cx="120" cy="256" r="3.5" />
        <circle cx="124" cy="286" r="3.5" />
        <circle cx="146" cy="226" r="3.5" />
        <circle cx="152" cy="256" r="3.5" />
      </g>
      {brazoIzq(100, W)}
      {brazoDer(100, W)}
      <Cara_ cara={cara} r={r} uid={uid} />
      <path d="M86 98 Q84 70 98 62 L90 110 Z M154 98 Q156 70 142 62 L150 110 Z" fill="#3a2a20" />
      {/* pañuelo rojo con lunares */}
      <path d="M82 92 Q82 42 120 40 Q158 42 158 92 Q120 76 82 92 Z" fill={R} stroke={K} strokeWidth="3" />
      <g fill={W}>
        <circle cx="100" cy="64" r="3" />
        <circle cx="120" cy="54" r="3" />
        <circle cx="140" cy="64" r="3" />
        <circle cx="110" cy="76" r="2.5" />
        <circle cx="132" cy="74" r="2.5" />
      </g>
      <path d="M156 82 L178 72 L172 96 Z" fill={R} stroke={K} strokeWidth="3" />
    </g>
  );
}

function Gato({ cara }: Figura) {
  const ojo = cara === "feliz" ? "cerrado" : "abierto";
  return (
    <g transform="translate(20 50)">
      <path d="M150 270 Q190 230 176 190 Q170 176 180 168" fill="none" stroke={K} strokeWidth="14" strokeLinecap="round" />
      <path d="M36 280 Q40 196 100 190 Q160 196 164 280 Z" fill={K} />
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

/** El cuerpo en SVG (sin el <svg> de afuera), para componer escenas ilustradas. */
export function Cuerpo({ quien, cara, noche }: { quien: Quien; cara: Cara; noche?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const f: Figura = { cara, noche, uid };
  switch (quien) {
    case "vera":
      return <Vera {...f} />;
    case "teo":
      return <Teo {...f} />;
    case "mora":
      return <Mora {...f} />;
    case "dante":
      return <Dante {...f} />;
    case "sol":
      return <Sol {...f} />;
    case "amalia":
      return <Amalia {...f} />;
    case "luna":
      return <Luna {...f} />;
    case "bruno":
      return <Bruno {...f} />;
    case "cami":
      return <Cami {...f} />;
    case "evelyn":
      return <Evelyn {...f} />;
    case "gris":
      return <Abrigo {...f} revelado={false} />;
    case "gervasio":
      return <Abrigo {...f} revelado />;
    case "lisandro":
      return <Lisandro {...f} />;
    case "agustin":
      return <Agustin {...f} />;
    case "gato":
      return <Gato {...f} />;
  }
}

/** Efecto CSS cuando la ilustración no tiene la expresión pedida (se usa la normal). */
const EFECTO: Partial<Record<Cara, string>> = {
  sonrojo: s.efSonrojo,
  feliz: s.efFeliz,
  sonrisa: s.efFeliz,
  triste: s.efTriste,
  enojo: s.efEnojo,
  sorpresa: s.efSorpresa,
  serio: s.efSerio,
  picara: s.efPicara,
  guino: s.efPicara,
};

export function Retrato({ quien, cara, noche }: { quien: Quien; cara: Cara; noche?: boolean }) {
  const img = imagenRetrato(quien, cara, noche);
  if (img) {
    const ef = img.exacta ? "" : (EFECTO[cara] ?? "");
    return (
      <div className={`${s.img} ${ef} ${quien === "gris" ? s.oculto : ""}`} role="img" aria-label={quien}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustraciones locales chicas, sin optimizador */}
        <img src={img.src} alt="" decoding="async" draggable={false} />
        {!img.exacta && <span className={s.capa} aria-hidden="true" />}
      </div>
    );
  }
  return (
    <svg viewBox="0 0 240 330" role="img" aria-label={quien} preserveAspectRatio="xMidYMax meet">
      <Cuerpo quien={quien} cara={cara} noche={noche} />
    </svg>
  );
}
