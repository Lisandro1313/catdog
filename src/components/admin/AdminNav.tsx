"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** Lo que se usa todos los días: va siempre a la vista. */
const PRINCIPALES = [
  { href: "/admin/salon", label: "Salón" },
  { href: "/admin/gastos", label: "Gastos" },
  { href: "/admin", label: "Cenas" },
  { href: "/admin/recetas", label: "Recetas" },
  { href: "/admin/estadisticas", label: "Números" },
];

/** Lo que se mira de vez en cuando: detrás de "Más", para que la barra no sea un tren. */
const SECUNDARIOS = [
  { href: "/admin/contactos", label: "Contactos" },
  { href: "/admin/premios", label: "Premios" },
  { href: "/admin/huellas", label: "Huellas" },
  { href: "/admin/sobremesa", label: "Charla" },
  { href: "/admin/mesitas", label: "QR" },
  { href: "/admin/ajustes", label: "Ajustes" },
];


function enSecundario(pathname: string): boolean {
  return SECUNDARIOS.some((s) => isActive(pathname, s.href));
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/eventos");
  return pathname === href || pathname.startsWith(href + "/");
}

/** Links del panel: arriba en escritorio, barra fija abajo en el celular. */
export function AdminNav({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  if (variant === "top") {
    // Diez links no entran en la barra: se parten en varios renglones y queda todo desprolijo.
    // Van los de todos los días, y el resto se despliega.
    return (
      <>
        {PRINCIPALES.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`whitespace-nowrap ${isActive(pathname, it.href) ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
          >
            {it.label}
          </Link>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className={`whitespace-nowrap ${abierto || enSecundario(pathname) ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
          >
            Más ▾
          </button>
          {abierto && (
            <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
              {SECUNDARIOS.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setAbierto(false)}
                  className={`block px-4 py-2.5 text-sm hover:bg-surface-2 ${isActive(pathname, it.href) ? "text-accent" : "text-muted"}`}
                >
                  {it.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur sm:hidden" aria-label="Secciones del panel">
      {/* Lo de todos los días entra en una sola fila; el resto se despliega. Antes eran ocho links
          repartidos en 375 px: 46 px cada uno y las palabras no entraban. */}
      {abierto && (
        <ul className="grid grid-cols-2 gap-px border-b border-line bg-line">
          {SECUNDARIOS.map((it) => (
            <li key={it.href} className="min-w-0">
              <Link
                href={it.href}
                onClick={() => setAbierto(false)}
                className={`flex min-h-12 items-center bg-bg px-4 text-sm ${isActive(pathname, it.href) ? "text-accent" : "text-muted"}`}
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-6" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {PRINCIPALES.map((it) => {
          const on = isActive(pathname, it.href);
          return (
            <li key={it.href} className="min-w-0">
              <Link
                href={it.href}
                onClick={() => setAbierto(false)}
                className={`flex min-h-12 items-center justify-center border-t-2 px-1 text-[0.8rem] ${
                  on ? "border-accent text-accent" : "border-transparent text-muted"
                }`}
                aria-current={on ? "page" : undefined}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className={`flex min-h-12 w-full items-center justify-center border-t-2 px-1 text-[0.8rem] ${
              abierto || enSecundario(pathname) ? "border-accent text-accent" : "border-transparent text-muted"
            }`}
          >
            Más
          </button>
        </li>
      </ul>
    </nav>
  );
}
