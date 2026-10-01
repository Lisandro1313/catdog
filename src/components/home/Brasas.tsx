/**
 * El rescoldo de abajo y las chispas que suben.
 *
 * Estaba escrito adentro del afiche de las cenas, así que con la casa abierta no se veía: el otro
 * afiche es otro bloque. Acá vive una sola vez y lo usan los dos.
 *
 * Cada chispa lleva su posición, tamaño, demora y deriva propias para que no se note el patrón.
 * Todo con transform y opacity, que son las dos cosas que el navegador anima sin repintar.
 */
const CHISPAS = [
  { x: "4%", tam: "3px", demora: "0s", dura: "11s", deriva: "18px" },
  { x: "9%", tam: "5px", demora: "6.5s", dura: "9s", deriva: "26px" },
  { x: "14%", tam: "2px", demora: "3.2s", dura: "16s", deriva: "-14px" },
  { x: "19%", tam: "3px", demora: "9.8s", dura: "12s", deriva: "12px" },
  { x: "24%", tam: "5px", demora: "5.1s", dura: "9.5s", deriva: "24px" },
  { x: "29%", tam: "2px", demora: "12.4s", dura: "15s", deriva: "-22px" },
  { x: "33%", tam: "3px", demora: "1.3s", dura: "13s", deriva: "-20px" },
  { x: "38%", tam: "4px", demora: "7.9s", dura: "10s", deriva: "16px" },
  { x: "43%", tam: "2px", demora: "4.6s", dura: "17s", deriva: "-28px" },
  { x: "47%", tam: "3px", demora: "10.7s", dura: "11s", deriva: "14px" },
  { x: "52%", tam: "5px", demora: "2.4s", dura: "8.5s", deriva: "22px" },
  { x: "57%", tam: "2px", demora: "8.1s", dura: "14s", deriva: "-16px" },
  { x: "61%", tam: "3px", demora: "13.6s", dura: "12.5s", deriva: "20px" },
  { x: "66%", tam: "4px", demora: "0.9s", dura: "10.5s", deriva: "-24px" },
  { x: "70%", tam: "2px", demora: "6.2s", dura: "16.5s", deriva: "10px" },
  { x: "75%", tam: "5px", demora: "11.3s", dura: "9s", deriva: "28px" },
  { x: "79%", tam: "3px", demora: "3.7s", dura: "13.5s", deriva: "-18px" },
  { x: "84%", tam: "2px", demora: "14.9s", dura: "15.5s", deriva: "16px" },
  { x: "88%", tam: "4px", demora: "5.8s", dura: "10s", deriva: "-26px" },
  { x: "92%", tam: "3px", demora: "9.1s", dura: "12s", deriva: "24px" },
  { x: "96%", tam: "2px", demora: "2.8s", dura: "17.5s", deriva: "-12px" },
  /* Tres bien chiquitas y lentas: las que parecen estar más lejos, atrás del fuego. */
  { x: "21%", tam: "2px", demora: "15.7s", dura: "19s", deriva: "8px" },
  { x: "55%", tam: "2px", demora: "17.2s", dura: "20s", deriva: "-9px" },
  { x: "83%", tam: "2px", demora: "16.4s", dura: "18.5s", deriva: "11px" },
];

export function Brasas() {
  return (
    <div className="ap-brasas" aria-hidden="true">
      {CHISPAS.map((c, i) => (
        <span
          key={i}
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
    </div>
  );
}
