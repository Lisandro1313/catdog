"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { borrarMioAction, responderAction } from "@/app/sobremesa/actions";
import { MAX_TEXTO } from "@/lib/foro-tipos";
import { guardarNombre, leerNombre, subscribeNombre } from "./nombre";

/** Contestar un tema. Igual que al abrirlo: nombre guardado en el teléfono, nada de cuentas. */
export function Responder({ temaId }: { temaId: string }) {
  const router = useRouter();
  const recordado = useSyncExternalStore(subscribeNombre, leerNombre, () => "");
  const [escrito, setEscrito] = useState<string | null>(null);
  const name = escrito ?? recordado;
  const [text, setText] = useState("");
  const [web, setWeb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await responderAction({ temaId, text, author: name, web });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      guardarNombre(name);
      setText("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="card grid gap-3 p-5">
      <textarea
        className="input min-h-24"
        placeholder="Tu respuesta…"
        aria-label="Tu respuesta"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_TEXTO}
        required
        minLength={2}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          className="input"
          placeholder="Tu nombre"
          aria-label="Tu nombre"
          value={name}
          onChange={(e) => setEscrito(e.target.value)}
          maxLength={40}
          required
          minLength={2}
        />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Publicando…" : "Responder"}
        </button>
      </div>
      {/* Campo trampa para robots: fuera de la vista y del tabulador. */}
      <input className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" value={web} onChange={(e) => setWeb(e.target.value)} name="web" />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/** "Borrar lo mío": solo aparece en lo que escribió este mismo teléfono. */
export function BorrarMio({ id, tipo, volverAlIndice }: { id: string; tipo: "tema" | "respuesta"; volverAlIndice?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(tipo === "tema" ? "¿Borrar este tema y toda su charla?" : "¿Borrar tu respuesta?")) return;
        startTransition(async () => {
          await borrarMioAction({ id, tipo });
          if (volverAlIndice) router.push("/sobremesa");
          else router.refresh();
        });
      }}
    >
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}
