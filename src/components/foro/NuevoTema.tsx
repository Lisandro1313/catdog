"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { abrirTemaAction } from "@/app/sobremesa/actions";
import { MAX_TEXTO, MAX_TITULO } from "@/lib/foro-tipos";
import { guardarNombre, leerNombre, subscribeNombre } from "./nombre";

/** Abrir un tema nuevo. El nombre queda guardado en el teléfono para no escribirlo cada vez. */
export function NuevoTema() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  // El nombre sale del navegador; si lo tocan en el formulario, manda lo escrito.
  const recordado = useSyncExternalStore(subscribeNombre, leerNombre, () => "");
  const [escrito, setEscrito] = useState<string | null>(null);
  const name = escrito ?? recordado;
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [web, setWeb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await abrirTemaAction({ title, text, author: name, web });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      guardarNombre(name);
      setTitle("");
      setText("");
      setAbierto(false);
      // Refrescar además de navegar: si no, la lista guardada en el navegador sigue mostrando lo de antes.
      router.refresh();
      if (r.id) router.push(`/sobremesa/${r.id}`);
    });
  }

  if (!abierto) {
    return (
      <button className="btn btn-primary w-full" type="button" onClick={() => setAbierto(true)}>
        Abrir un tema
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="card grid gap-3 p-5">
      <input
        className="input"
        placeholder="El título (de qué querés hablar)"
        aria-label="Título del tema"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITULO}
        required
        minLength={3}
      />
      <textarea
        className="input min-h-28"
        placeholder="Contá un poco más…"
        aria-label="El tema"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_TEXTO}
        required
        minLength={3}
      />
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
      {/* Campo trampa: queda fuera de la vista y del tabulador; si viene con algo, es un robot. */}
      <input
        className="sr-only"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={web}
        onChange={(e) => setWeb(e.target.value)}
        name="web"
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Publicando…" : "Publicar"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setAbierto(false)} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
