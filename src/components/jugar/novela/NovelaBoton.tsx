import s from "./NovelaBoton.module.css";

/** El acceso a la novela desde el hub: grande, rojo y en diagonal, como la novela. */
export function NovelaBoton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={s.boton} onClick={onClick}>
      <span className={s.fondo} aria-hidden="true" />
      <span className={s.etiqueta}>Novela de la casa · nuevo</span>
      <span className={s.titulo}>
        <span className={s.a}>¿Quién</span> <span className={s.b}>te</span> <span className={s.c}>contó?</span>
      </span>
      <span className={s.bajada}>Una semana en CatDog. Cuatro vínculos, un misterio en tinta verde y siete finales. 20 minutos.</span>
      <span className={s.flecha} aria-hidden="true">
        ▶
      </span>
    </button>
  );
}
