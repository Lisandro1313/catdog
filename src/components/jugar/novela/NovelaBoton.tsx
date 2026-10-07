import s from "./NovelaBoton.module.css";

/** El acceso a la novela desde el hub: grande, rojo y en diagonal, como la novela. */
export function NovelaBoton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={s.boton} onClick={onClick}>
      <span className={s.fondo} aria-hidden="true" />
      <span className={s.etiqueta}>Temporada 2 · nueva</span>
      <span className={s.titulo}>
        <span className={s.a}>¿Quién</span> <span className={s.b}>te</span> <span className={s.c}>contó?</span>
      </span>
      <span className={s.bajada}>La casa se vende: treinta días para salvarla. Cinco vínculos con romance, misterio en tinta verde, 17 finales. Unas 2 horas.</span>
      <span className={s.flecha} aria-hidden="true">
        ▶
      </span>
    </button>
  );
}
