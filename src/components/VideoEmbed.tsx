"use client";

import { useState } from "react";

/** YouTube en modo privacidad (sin cookies hasta que se toca) o un .mp4 directo. Carga el iframe recién al tocar. */
export function VideoEmbed({ url, title = "La casa" }: { url: string; title?: string }) {
  const [play, setPlay] = useState(false);
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
  const isFile = /\.(mp4|webm)(\?|$)/i.test(url);
  if (!yt && !isFile) return null;

  if (isFile) {
    return (
      <video className="video" controls playsInline preload="metadata" src={url}>
        {title}
      </video>
    );
  }

  const id = yt![1];
  return (
    <div className="video">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button type="button" className="video-poster" onClick={() => setPlay(true)} aria-label={`Reproducir: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="video-play">▶</span>
        </button>
      )}
    </div>
  );
}
