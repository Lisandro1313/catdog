"use client";

import { useEffect, useRef, useState } from "react";
import { beep, tap } from "./Shell";
import css from "./Cuenta.module.css";

/**
 * Cuenta regresiva "3, 2, 1, ¡ya!" encima del juego, con un pip por número.
 * Sirve para que el dedo esté listo antes de que arranque el reloj (y de paso despierta el audio).
 */
export function Cuenta({ onGo, desde = 3, paso = 600 }: { onGo: () => void; desde?: number; paso?: number }) {
  const [n, setN] = useState(desde);
  const go = useRef(onGo);
  useEffect(() => {
    go.current = onGo;
  });

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    beep(660, 90, "triangle", 0.14);
    for (let k = 1; k <= desde; k++) {
      ids.push(
        setTimeout(() => {
          const left = desde - k;
          setN(left);
          if (left > 0) beep(660, 90, "triangle", 0.14);
          else {
            beep(990, 160, "triangle", 0.18);
            tap(20);
          }
        }, k * paso),
      );
    }
    ids.push(setTimeout(() => go.current(), desde * paso + 260));
    return () => ids.forEach(clearTimeout);
  }, [desde, paso]);

  return (
    <div className={css.cuenta} aria-live="assertive">
      <span key={n} className={`${css.num} ${n === 0 ? css.ya : ""}`}>
        {n > 0 ? n : "¡Ya!"}
      </span>
    </div>
  );
}
