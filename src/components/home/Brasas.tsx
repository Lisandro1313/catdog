/**
 * El rescoldo de abajo y las chispas que suben.
 *
 * Vive acá una sola vez y lo usan los dos afiches (la casa abierta y las cenas).
 *
 * Las posiciones salen de un generador con semilla fija, no de Math.random: el servidor y el
 * navegador tienen que dibujar exactamente lo mismo o React se queja de que no coinciden. Con la
 * semilla fija también se puede volver a una composición que gustó.
 *
 * Son dos capas, como un fuego de verdad: las chispas (muchas, chicas y rápidas, que nacen del
 * rescoldo) y las pavesas (pocas, grandes y lentas, que flotan más arriba y dan profundidad).
 * Todo con transform y opacity, que son las dos cosas que el navegador anima sin repintar.
 */

/** Generador con semilla: siempre la misma secuencia, en el servidor y en el navegador. */
function dado(semilla: number) {
  let s = semilla;
  return (min: number, max: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return min + (s / 4294967296) * (max - min);
  };
}

const r = dado(20261005);
const n2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Las chispas se amontonan abajo y se van espaciando hacia los costados, que es donde está el
 * rescoldo: repartidas parejo parecían una lluvia de estrellas, no un fuego.
 */
const CHISPAS = Array.from({ length: 42 }, (_, i) => {
  // Un poco de sesgo al centro, donde está la panza de calor.
  const centro = (i % 2 === 0 ? 1 : -1) * Math.pow(r(0, 1), 1.7) * 50;
  return {
    x: `${n2(50 + centro)}%`,
    tam: `${Math.round(r(2, 6))}px`,
    demora: `${n2(r(0, 18))}s`,
    dura: `${n2(r(8, 17))}s`,
    deriva: `${Math.round(r(-34, 34))}px`,
  };
});

/** Las pavesas: grandes, lentas y desenfocadas. Son las que se ven aunque no mires. */
const PAVESAS = Array.from({ length: 7 }, () => ({
  x: `${n2(r(8, 92))}%`,
  tam: `${Math.round(r(7, 12))}px`,
  demora: `${n2(r(0, 24))}s`,
  dura: `${n2(r(19, 30))}s`,
  deriva: `${Math.round(r(-60, 60))}px`,
}));

export function Brasas() {
  return (
    <div className="ap-brasas" aria-hidden="true">
      {CHISPAS.map((c, i) => (
        <span
          key={`c${i}`}
          className="ap-chispa"
          style={
            {
              "--x": c.x,
              "--tam": c.tam,
              "--demora": c.demora,
              "--dura": c.dura,
              "--deriva": c.deriva,
            } as React.CSSProperties
          }
        />
      ))}
      {PAVESAS.map((c, i) => (
        <span
          key={`p${i}`}
          className="ap-chispa ap-pavesa"
          style={
            {
              "--x": c.x,
              "--tam": c.tam,
              "--demora": c.demora,
              "--dura": c.dura,
              "--deriva": c.deriva,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
