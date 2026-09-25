"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * El panel tenía once destinos sueltos en la barra. Son muchos para cinco cosas que se hacen, así que
 * van agrupados por lo que uno está haciendo: atender la noche, manejar las fechas, mirar la plata,
 * ver lo que dejó la gente, y configurar.
 *
 * Cada grupo tiene una pantalla principal (la primera) y las demás aparecen como solapas adentro.
 */
export type Destino = { href: string; label: string };
export type Grupo = { label: string; pantallas: Destino[] };

export const GRUPOS: Grupo[] = [
  {
    label: "Salón",
    pantallas: [
      { href: "/admin/salon", label: "El salón" },
      { href: "/admin/mesitas", label: "QR de las mesas" },
    ],
  },
  {
    label: "Cenas",
    pantallas: [{ href: "/admin", label: "Las fechas" }],
  },
  {
    label: "Plata",
    pantallas: [
      { href: "/admin/gastos", label: "Caja y gastos" },
      { href: "/admin/estadisticas", label: "Números" },
      { href: "/admin/recetas", label: "Recetas y costos" },
    ],
  },
  {
    label: "La gente",
    pantallas: [
      { href: "/admin/contactos", label: "Contactos" },
      { href: "/admin/huellas", label: "Huellas" },
      { href: "/admin/sobremesa", label: "Charla" },
      { href: "/admin/premios", label: "Premios" },
    ],
  },
  {
    label: "Ajustes",
    pantallas: [{ href: "/admin/ajustes", label: "Ajustes" }],
  },
];

function esta(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/eventos");
  return pathname === href || pathname.startsWith(href + "/");
}

/** En qué grupo estamos parados. */
export function grupoDe(pathname: string): Grupo | null {
  return GRUPOS.find((g) => g.pantallas.some((p) => esta(pathname, p.href))) ?? null;
}

/** Links del panel: arriba en escritorio, barra fija abajo en el celular. */
export function AdminNav({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const actual = grupoDe(pathname);

  if (variant === "top") {
    return (
      <>
        {GRUPOS.map((g) => (
          <Link
            key={g.label}
            href={g.pantallas[0].href}
            className={`whitespace-nowrap ${g === actual ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
          >
            {g.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur sm:hidden" aria-label="Secciones del panel">
      <ul className="grid grid-cols-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {GRUPOS.map((g) => {
          const on = g === actual;
          return (
            <li key={g.label} className="min-w-0">
              <Link
                href={g.pantallas[0].href}
                className={`flex min-h-12 items-center justify-center border-t-2 px-1 text-[0.8rem] ${
                  on ? "border-accent text-accent" : "border-transparent text-muted"
                }`}
                aria-current={on ? "page" : undefined}
              >
                {g.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Las solapas de adentro del grupo. Solo aparecen cuando el grupo tiene más de una pantalla, así
 * "Cenas" y "Ajustes" no muestran una solapa sola sin sentido.
 */
export function SubNav() {
  const pathname = usePathname();
  const actual = grupoDe(pathname);
  if (!actual || actual.pantallas.length < 2) return null;

  return (
    <nav className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }} aria-label={`Dentro de ${actual.label}`}>
      {actual.pantallas.map((p) => {
        const on = esta(pathname, p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={`min-h-11 shrink-0 rounded-lg px-4 text-sm leading-[2.75rem] ${
              on ? "bg-surface-2 font-medium text-ink" : "text-muted hover:text-ink"
            }`}
            aria-current={on ? "page" : undefined}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
