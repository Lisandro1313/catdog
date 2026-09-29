"use client";

import { useState, useTransition } from "react";
import { pedirEventoAction } from "@/app/eventos/actions";
import { formatPrice } from "@/lib/config";
import { MAX_MENSAJE, MAX_PERSONAS, MIN_PERSONAS, claveDe, lineasDe, paqueteParaS, presupuestoBase, type Paquete } from "@/lib/eventos-tipos";

/**
 * Elegís cuántos son y ves lo que sale, antes de escribir nada.
 * El número no compromete: la fecha se toma recién con la seña, y eso se dice acá mismo.
 */
export function PedirEvento({
  paquetes,
  mesa,
  senaPorcentaje,
  publicarPrecios,
}: {
  paquetes: Paquete[];
  mesa: number;
  senaPorcentaje: number;
  publicarPrecios: boolean;
}) {
  const [personas, setPersonas] = useState(10);
  const [conMesa, setConMesa] = useState(false);
  const [name, setName] = useState("");
  const [contacto, setContacto] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [web, setWeb] = useState("");
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Si hay más de una línea (la de tapeo y una más simple), el grupo elige con cuál quiere.
  const lineas = lineasDe(paquetes);
  const [linea, setLinea] = useState(lineas[0] ?? "");
  const paquete = paqueteParaS(paquetes, personas, linea);
  // Si la casa no publica precios, acá no se inventa ninguno: el presupuesto se pasa por mensaje.
  const conPrecio = publicarPrecios && Boolean(paquete && paquete.precio > 0);
  const total = presupuestoBase(paquete, personas) + (conMesa && mesa > 0 ? mesa : 0);
  const sena = Math.round((total * senaPorcentaje) / 100 / 1000) * 1000;

  if (listo) {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-2xl">Nos llegó</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Te escribimos para confirmarte la fecha y pasarte los datos de la seña. Hasta que la seña esté, la fecha no queda tomada:
          te lo decimos para que nadie se quede con las ganas.
        </p>
      </div>
    );
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await pedirEventoAction({
        name,
        contacto,
        fecha,
        personas,
        paquete: paquete ? claveDe(paquete) : "",
        conMesa,
        mensaje,
        web,
      });
      if (r.ok) setListo(true);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={enviar} className="card p-5 sm:p-6">
      {lineas.length > 1 && (
        <>
          <p className="ap-eyebrow">¿Qué quieren comer?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {lineas.map((l) => {
              const muestra = paqueteParaS(paquetes, personas, l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLinea(l)}
                  aria-pressed={linea === l}
                  className={`min-h-12 rounded-xl border px-4 py-3 text-left transition-colors ${
                    linea === l ? "border-accent bg-accent/10 text-ink" : "border-line text-muted hover:border-accent/50"
                  }`}
                >
                  <span className="block font-display text-lg">{l}</span>
                  {publicarPrecios && muestra && muestra.precio > 0 && (
                    <span className="block text-sm text-muted">desde {formatPrice(muestra.precio)} por persona</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-6" />
        </>
      )}

      <p className="ap-eyebrow">¿Cuántos son?</p>
      <div className="mt-3 flex items-center gap-4">
        <input
          className="flex-1 accent-[var(--ap-gold)]"
          type="range"
          min={MIN_PERSONAS}
          max={MAX_PERSONAS}
          value={personas}
          onChange={(e) => setPersonas(Number(e.target.value))}
          aria-label="Cuántas personas"
        />
        <span className="font-display text-3xl tabular-nums">{personas}</span>
      </div>

      {paquete && (
        <div className="mt-5 rounded-xl border border-line p-4">
          <p className="font-display text-xl">{paquete.nombre}</p>
          <ul className="mt-2 grid gap-1 text-sm text-muted">
            {paquete.incluye.map((x) => (
              <li key={x}>· {x}</li>
            ))}
          </ul>
          {conPrecio ? (
            <>
              <p className="mt-3 text-sm text-muted">
                {formatPrice(paquete.precio)} por persona
                {conMesa && mesa > 0 && ` · mesa para todo el evento ${formatPrice(mesa)}`}
              </p>
              <p className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                <span className="ap-eyebrow">Sale</span>
                <span className="font-display text-3xl text-accent tabular-nums">{formatPrice(total)}</span>
              </p>
              <p className="mt-1 text-right text-xs text-muted">Seña para tomar la fecha: {formatPrice(sena)}</p>
            </>
          ) : (
            <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
              Contanos y te pasamos el presupuesto cerrado por mensaje, con esto adentro.
            </p>
          )}
        </div>
      )}

      {mesa > 0 && (
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--ap-gold)]" checked={conMesa} onChange={(e) => setConMesa(e.target.checked)} />
          <span>
            Quiero la mesa (pool y ping pong) para todo el evento
            <span className="block text-xs text-muted">
              {mesa > 0 ? `${formatPrice(mesa)} la noche entera.` : "Va en el presupuesto."} Si no, se puede alquilar por hora en el
              momento.
            </span>
          </span>
        </label>
      )}

      <div className="mt-5 grid gap-3">
        <input className="input" placeholder="Tu nombre" aria-label="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
        <input
          className="input"
          placeholder="WhatsApp o mail para contestarte"
          aria-label="Cómo te contactamos"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          required
          minLength={6}
          maxLength={60}
        />
        <input
          className="input"
          placeholder="¿Para cuándo? (un sábado de noviembre, el 12, lo que sea)"
          aria-label="Para cuándo"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          minLength={3}
          maxLength={60}
        />
        <textarea
          className="input min-h-20"
          placeholder="¿Algo que tengamos que saber? Alergias, si es un cumpleaños, si quieren algo puntual…"
          aria-label="Mensaje"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          maxLength={MAX_MENSAJE}
        />
        {/* Campo trampa: fuera de la vista y del tabulador. */}
        <input className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" value={web} onChange={(e) => setWeb(e.target.value)} name="web" />
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary mt-4 w-full" type="submit" disabled={pending}>
        {pending ? "Mandando…" : "Consultar la fecha"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Esto no reserva nada todavía: te contestamos, y la fecha queda tomada cuando llega la seña.
      </p>
    </form>
  );
}
