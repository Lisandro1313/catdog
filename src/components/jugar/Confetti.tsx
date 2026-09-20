"use client";

import { useEffect, useState } from "react";

type Piece = { x: number; delay: number; dur: number; rot: number; size: number; color: string; drift: number };

const COLORS = ["#e0c283", "#c9a96e", "#f3ede4", "#b4453a"];

/** Lluvia corta de papelitos dorados (CSS puro; se genera en el cliente para no pelear con la hidratación). */
export function Confetti({ count = 36 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    const id = setTimeout(() => {
      setPieces(
        Array.from({ length: count }, () => ({
          x: Math.random() * 100,
          delay: Math.random() * 0.8,
          dur: 2.2 + Math.random() * 1.4,
          rot: Math.random() * 720 - 360,
          size: 5 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          drift: Math.random() * 80 - 40,
        })),
      );
    }, 0);
    return () => clearTimeout(id);
  }, [count]);

  return (
    <div className="jg-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              left: `${p.x}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              "--rot": `${p.rot}deg`,
              "--drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
