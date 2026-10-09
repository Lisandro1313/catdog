"use client";

import { GAME_INFO } from "@/components/jugar/info";
import { etiquetaDe } from "@/lib/origen";
import { NOMBRE_EXTRA, type FilaJuego } from "@/lib/juegos-stats";
import type { JuegosStats } from "@/lib/admin-stats";
import type { GameId } from "@/lib/juegos";

const ICONO_EXTRA: Record<string, string> = { novela: "📖", impostor: "🕵️", duelo: "⚔️", torneo: "🏆" };

function nombre(id: string): { icono: string; titulo: string } {
  const info = GAME_INFO[id as GameId];
  if (info) return { icono: info.icon, titulo: info.title };
  return { icono: ICONO_EXTRA[id] ?? "🎮", titulo: NOMBRE_EXTRA[id as keyof typeof NOMBRE_EXTRA] ?? id };
}

/** "" es el que entró sin `?de=`: escribió la dirección, o le pasaron el link pelado. */
const origen = (de: string) => (de ? etiquetaDe(de) : "Directo");

/** Instagram es la bio más las historias: para el negocio es la misma puerta. */
const deInstagram = (f: FilaJuego) => (f.porOrigen.ig ?? 0) + (f.porOrigen.historia ?? 0);

function Chips({ datos }: { datos: Record<string, number> }) {
  const lista = Object.entries(datos).sort((a, b) => b[1] - a[1]);
  if (lista.length === 0) return <p className="mt-2 text-xs text-muted">Todavía nada.</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2 text-xs">
      {lista.map(([de, n]) => (
        <li key={de} className={`rounded-full border px-3 py-1 ${de === "ig" || de === "historia" ? "border-accent/50 text-ink" : "border-line text-muted"}`}>
          {origen(de)} <span className="text-ink">{n}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Los juegos en el panel: quién llega a jugar, a qué, y si vino de Instagram. Sin nombres: son
 * contadores por día, como las visitas.
 */
export function JuegosPanel({ datos }: { datos: JuegosStats }) {
  const entraron = Object.values(datos.pagina).reduce((n, c) => n + c, 0);
  const novela = datos.juegos.find((j) => j.id === "novela");
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl">Los juegos</h2>
        <p className="text-xs text-muted">Últimos 30 días. Sin nombres: se cuenta por teléfono y sesión.</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Dato label="Entraron a los juegos" valor={entraron} />
        <Dato label="Jugaron (7 días)" valor={datos.personas7} nota="teléfonos que terminaron una partida" />
        <Dato label="Jugaron (30 días)" valor={datos.personas30} />
        <Dato label="Tragos ganados" valor={datos.tragos} nota={`${datos.canjeados} canjeados`} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="ap-eyebrow">De dónde llegaron a la página de juegos</p>
          <Chips datos={datos.pagina} />
        </div>
        <div>
          <p className="ap-eyebrow">De dónde venían los que abrieron un juego</p>
          <Chips datos={datos.aperturasPorOrigen} />
          {novela && (
            <p className="mt-3 text-xs text-muted">
              La novela la abrieron <span className="text-ink">{novela.abrieron}</span>
              {deInstagram(novela) > 0 && <> ({deInstagram(novela)} desde Instagram)</>}.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="ap-eyebrow">A qué jugaron</p>
        {datos.juegos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Todavía no hay datos de juegos: se empezó a contar el 9 de octubre. Apenas alguien abra uno, aparece acá.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1.5 font-normal">Juego</th>
                  <th className="py-1.5 pl-2 text-right font-normal">Abrieron</th>
                  <th className="py-1.5 pl-2 text-right font-normal">Partidas</th>
                  <th className="py-1.5 pl-2 text-right font-normal" title="Desde Instagram (bio e historias)">De IG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {datos.juegos.map((j) => {
                  const { icono, titulo } = nombre(j.id);
                  return (
                    <tr key={j.id}>
                      <td className="py-1.5">
                        <span aria-hidden="true">{icono}</span> {titulo}
                      </td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{j.abrieron}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{j.terminaron || "—"}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{deInstagram(j) || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">
              Partidas: las que se terminaron. De IG: llegaron desde la bio o una historia. El Impostor, la novela, el duelo y el torneo no tienen puntaje, así que solo se cuenta
              que los abrieron.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Dato({ label, valor, nota }: { label: string; valor: number; nota?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-display text-3xl tabular-nums">{valor}</p>
      {nota && <p className="text-[11px] text-muted">{nota}</p>}
    </div>
  );
}
