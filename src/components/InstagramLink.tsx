export function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * El link al Instagram, igual en todas las páginas y contado como cualquier otra cosa que se toca.
 *
 * Existe porque las páginas a las que se manda gente desde Instagram (la carta, los eventos, los
 * productos) no tenían forma de volver: alguien entraba desde una historia, le gustaba, y se iba
 * sin poder seguir la cuenta. El link estaba sólo en el inicio, que es justo la página por la que
 * esa persona no pasó.
 */
export function InstagramLink({ handle, className = "" }: { handle: string; className?: string }) {
  if (!handle) return null;
  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      data-mide="instagram"
      className={`inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink ${className}`}
    >
      <InstagramIcon /> @{handle}
    </a>
  );
}
