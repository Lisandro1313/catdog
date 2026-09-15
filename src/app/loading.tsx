/** Se ve un instante mientras el servidor arma la página (con conexión lenta evita la pantalla en blanco). */
export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center" aria-busy="true" aria-live="polite">
      <div className="h-14 w-56 animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-6 h-4 w-40 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded bg-surface-2" />
    </div>
  );
}
