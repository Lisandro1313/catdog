"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/gastos", label: "Gastos", icon: "🧾" },
  { href: "/admin", label: "Cenas", icon: "🍽️" },
  { href: "/admin/recetas", label: "Recetas", icon: "📋" },
  { href: "/admin/contactos", label: "Contactos", icon: "👥" },
  { href: "/admin/premios", label: "Premios", icon: "🏆" },
  { href: "/admin/huellas", label: "Huellas", icon: "✍️" },
  { href: "/admin/sobremesa", label: "Charla", icon: "💬" },
  { href: "/admin/ajustes", label: "Ajustes", icon: "⚙️" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/eventos");
  return pathname === href || pathname.startsWith(href + "/");
}

/** Links del panel: arriba en escritorio, barra fija abajo en el celular. */
export function AdminNav({ variant }: { variant: "top" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "top") {
    return (
      <>
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={isActive(pathname, it.href) ? "text-ink font-medium" : "text-muted hover:text-ink"}
          >
            {it.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur sm:hidden" aria-label="Secciones del panel">
      {/* Una columna por link: con menos, el último se desbordaba fuera de la pantalla. */}
      <ul className="grid" style={{ paddingBottom: "env(safe-area-inset-bottom)", gridTemplateColumns: `repeat(${ITEMS.length}, minmax(0, 1fr))` }}>
        {ITEMS.map((it) => {
          const on = isActive(pathname, it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] ${on ? "text-accent" : "text-muted"}`}
                aria-current={on ? "page" : undefined}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {it.icon}
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
