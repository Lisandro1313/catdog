import type { CSSProperties } from "react";
import { urlEmoji } from "@/lib/emoji-3d";

/**
 * Un emoji en 3D, del mismo tamaño que el texto que lo rodea (1em) salvo que se pida otro.
 * Si no hay versión 3D, queda el del teléfono. Es decorativo: el texto de al lado dice lo que es.
 */
export function Emoji({ e, size = "1em", className, style }: { e: string; size?: string; className?: string; style?: CSSProperties }) {
  const src = urlEmoji(e);
  if (!src) return <span className={className} style={style}>{e}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 160 px fijos, ya optimizados: no hay nada que ganar con next/image
    <img
      src={src}
      alt={e}
      draggable={false}
      decoding="async"
      className={className}
      style={{ width: size, height: size, display: "inline-block", verticalAlign: "-0.15em", objectFit: "contain", userSelect: "none", ...style }}
    />
  );
}
