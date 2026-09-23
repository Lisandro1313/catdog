"use client";

import { useEffect, useRef, useState } from "react";
import { cancelarPedidoAction, huellaAction, pedidoAction, sugerirAction, votoAction, type ExtrasState } from "@/app/hoy/actions";
import type { BarItem } from "@/lib/menu";

/**
 * Lo que el invitado puede dejar durante la noche, además de jugar: su huella (frase y/o foto),
 * el voto al plato y al trago, un pedido a la barra y una recomendación. Cada bloque es
 * independiente y opcional; nada de esto se ve en público hasta que la casa lo aprueba.
 */

// ---------- foto achicada en el teléfono ----------

/** Achica la foto a 1400 px de lado máximo y la pasa a JPEG: sube en un segundo y no pesa en el store. */
async function shrink(file: File): Promise<File> {
  if (!/^image\//.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 1400;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k);
    const h = Math.round(bmp.height * k);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], "huella.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// ---------- huella ----------

export function Huella({ eventId, table, initial, onSaved }: { eventId: string; table: number | null; initial: ExtrasState["huellas"]; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Se monta después de hidratar (el mazo aparece recién ahí), así que puede leer el nombre guardado al inicio.
  const [name, setName] = useState(() => {
    try {
      return typeof localStorage === "undefined" ? "" : (localStorage.getItem("catdog:jugar:name") ?? "");
    } catch {
      return "";
    }
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const f = fileRef.current?.files?.[0];
    if (f) fd.set("photo", await shrink(f));
    else fd.delete("photo");
    let res: Awaited<ReturnType<typeof huellaAction>>;
    try {
      res = await huellaAction(fd);
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOk(true);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    try {
      localStorage.setItem("catdog:jugar:name", String(fd.get("name") ?? ""));
    } catch {
      // sin memoria
    }
    onSaved();
  }

  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="ap-eyebrow">Dejá tu huella</p>
      <p className="mt-1 text-xs text-muted">Una frase, una foto de la mesa, lo que quieras. Queda en el libro de la casa cuando lo aprobamos.</p>
      {initial.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {initial.map((h) => (
            <li key={h.id} className="text-muted">
              ✦ {h.name}
              {h.text ? `: “${h.text}”` : ""}
              {h.hasPhoto ? " · con foto" : ""} · <span className={h.approved ? "text-ok" : ""}>{h.approved ? "en el libro" : "la casa la mira"}</span>
            </li>
          ))}
        </ul>
      )}
      {ok ? (
        <p className="mt-3 text-sm text-ok">Gracias. Queda guardada; la vemos y la sumamos al libro.</p>
      ) : initial.length >= 3 ? null : (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <input type="hidden" name="eventId" value={eventId} />
          {table != null && <input type="hidden" name="table" value={table} />}
          <input className="input" name="name" aria-label="Tu nombre" placeholder="Tu nombre" maxLength={24} required value={name} onChange={(e) => setName(e.target.value)} />
          <textarea className="input" name="text" aria-label="Una frase para la casa" rows={2} maxLength={280} placeholder="Una frase para la casa (opcional si dejás foto)" />
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn btn-ghost btn-sm cursor-pointer">
              {preview ? "Cambiar foto" : "Sacar o elegir foto"}
              <input
                ref={fileRef}
                type="file"
                name="photo"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return f ? URL.createObjectURL(f) : null;
                  });
                }}
              />
            </label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
            )}
          </div>
          {error && (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-sm justify-self-start" type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Dejar huella"}
          </button>
        </form>
      )}
    </section>
  );
}

// ---------- plato y trago de la noche ----------

export function Votacion({ eventId, options, initial }: { eventId: string; options: { plato: string[]; trago: string[] }; initial: ExtrasState["votes"] }) {
  // Lo que tocó acá pisa lo que vino del servidor; si el voto falla, se vuelve al último confirmado.
  const [confirmed, setConfirmed] = useState<Partial<Record<"plato" | "trago", string>>>({});
  const [local, setLocal] = useState<Partial<Record<"plato" | "trago", string>>>({});
  const votes = { ...initial, ...confirmed, ...local };
  const [error, setError] = useState<string | null>(null);
  const [votando, setVotando] = useState<string | null>(null);

  async function vote(kind: "plato" | "trago", choice: string) {
    setLocal((l) => ({ ...l, [kind]: choice }));
    setError(null);
    setVotando(choice);
    let res: Awaited<ReturnType<typeof votoAction>>;
    try {
      res = await votoAction({ eventId, kind, choice });
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    setVotando(null);
    if (!res.ok) {
      setLocal((l) => {
        const { [kind]: _drop, ...rest } = l;
        void _drop;
        return rest;
      });
      setError(res.error);
    } else {
      setConfirmed((c) => ({ ...c, [kind]: choice }));
      try {
        navigator.vibrate?.(10);
      } catch {
        // sin vibración
      }
    }
  }

  if (!options.plato.length && !options.trago.length) return null;
  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="ap-eyebrow">Lo mejor de la noche</p>
      <p className="mt-1 text-xs text-muted">Un voto al plato y otro al trago. Podés cambiarlo hasta que te vayas; a la cocina le sirve de verdad.</p>
      {(["plato", "trago"] as const).map((kind) =>
        options[kind].length ? (
          <div key={kind} className="mt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{kind === "plato" ? "El plato" : "El trago"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {options[kind].map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`hoy-chip hoy-chip-plain ${votes[kind] === o ? "is-on" : ""} ${votando === o ? "opacity-60" : ""}`}
                  aria-pressed={votes[kind] === o}
                  aria-busy={votando === o}
                  disabled={votando !== null}
                  onClick={() => vote(kind, o)}
                >
                  {votes[kind] === o ? "✦ " : ""}
                  {o}
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

// ---------- pedidos a la barra ----------

type Pedido = { id: string; item: string; qty: number; status: string };

export function Barra({ eventId, table, bar, barPrice, pedidos, onChange }: { eventId: string; table: number | null; bar: BarItem[]; barPrice: string | null; pedidos: Pedido[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  async function pedir(item: string) {
    if (table == null) return;
    setBusy(item);
    setError(null);
    let res: Awaited<ReturnType<typeof pedidoAction>>;
    try {
      res = await pedidoAction({ eventId, table, item, qty: 1 });
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    setBusy(null);
    if (!res.ok) setError(res.error);
    else {
      setDone(item);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(() => setDone(null), 2500);
      onChange();
    }
  }

  const open = pedidos.filter((p) => p.status !== "cancelado");
  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="ap-eyebrow">Si querés algo más</p>
      <p className="mt-1 text-xs text-muted">
        La barra de hoy{barPrice ? ` · ${barPrice} cada uno` : ""}.{table != null ? " Tocá y te lo llevamos a la mesita; se paga al final." : " Pedilo por su nombre."}
      </p>
      <ul className="mt-4 space-y-3">
        {bar.map((b) => (
          <li key={b.name} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight">{b.name}</p>
              {b.description && <p className="text-xs leading-relaxed text-muted">{b.description}</p>}
            </div>
            {table != null && (
              <button type="button" className="btn btn-ghost btn-sm shrink-0" disabled={busy === b.name} onClick={() => pedir(b.name)}>
                {busy === b.name ? "…" : done === b.name ? "✓ Pedido" : "Pedir"}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {open.length > 0 && (
        <ul className="mt-4 divide-y divide-line text-sm">
          {open.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                {p.qty > 1 ? `${p.qty} × ` : ""}
                {p.item}
                <span className={`ml-2 text-xs ${p.status === "listo" ? "text-ok" : "text-muted"}`}>{p.status === "listo" ? "✓ va en camino" : "en la barra"}</span>
              </span>
              {p.status === "pendiente" && (
                <button
                  type="button"
                  className="-m-2 min-h-11 p-2 text-xs text-muted hover:text-ink"
                  onClick={async () => {
                    try {
                      await cancelarPedidoAction(p.id);
                    } catch {
                      // sin señal: el próximo refresco muestra el estado real
                    }
                    onChange();
                  }}
                >
                  cancelar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- recomendaciones ----------

export function Recomendar({ eventId }: { eventId: string | null }) {
  const [kind, setKind] = useState<"tema" | "idea">("tema");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 2) return;
    setPending(true);
    setError(null);
    let res: Awaited<ReturnType<typeof sugerirAction>>;
    try {
      res = await sugerirAction({ eventId, kind, text });
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    setPending(false);
    if (!res.ok) setError(res.error);
    else {
      setSent((s) => [...s, `${kind === "tema" ? "🎵" : "💡"} ${text.trim()}`]);
      setText("");
    }
  }

  return (
    <section className="mt-10 border-t border-line pt-6">
      <p className="ap-eyebrow">Recomendanos</p>
      <p className="mt-1 text-xs text-muted">Un tema para que suene en la casa, o una idea para la próxima. Lo leemos todo.</p>
      <form onSubmit={send} className="mt-4 grid gap-3">
        <div className="flex gap-2">
          <button type="button" className={`hoy-chip hoy-chip-plain ${kind === "tema" ? "is-on" : ""}`} aria-pressed={kind === "tema"} onClick={() => setKind("tema")}>
            🎵 Un tema
          </button>
          <button type="button" className={`hoy-chip hoy-chip-plain ${kind === "idea" ? "is-on" : ""}`} aria-pressed={kind === "idea"} onClick={() => setKind("idea")}>
            💡 Una idea
          </button>
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" aria-label={kind === "tema" ? "Tema y quién lo canta" : "Qué te gustaría la próxima"} value={text} onChange={(e) => setText(e.target.value)} maxLength={240} placeholder={kind === "tema" ? "Tema y quién lo canta" : "Qué te gustaría la próxima"} />
          <button className="btn btn-primary btn-sm shrink-0" type="submit" disabled={pending || text.trim().length < 2}>
            {pending ? "…" : "Mandar"}
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {sent.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {sent.map((s, i) => (
            <li key={i}>✓ {s}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- telón: sale un acto ----------

export function Telon({ roman, label, dish, drink, onOpen, onClose }: { roman: string; label: string; dish: string; drink: string | null; onOpen: () => void; onClose: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    try {
      navigator.vibrate?.([20, 40, 20]);
    } catch {
      // sin vibración
    }
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="hoy-telon" role="dialog" aria-modal="true" aria-label={`Sale ${roman}`}>
      <div className="hoy-curtains" aria-hidden="true">
        <span className="hoy-curtain left" />
        <span className="hoy-curtain right" />
      </div>
      <div className="hoy-telon-body">
        <p className="ap-eyebrow">Sale de la cocina</p>
        <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted">
          {roman} · {label}
        </p>
        <p className="ap-display mt-6 text-4xl leading-tight">{dish}</p>
        {drink && <p className="mt-3 font-display italic text-accent">con {drink}</p>}
        <button ref={first} className="btn btn-primary mt-10 px-8" type="button" onClick={onOpen}>
          Ver la carta
        </button>
        <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
          Después
        </button>
      </div>
    </div>
  );
}

