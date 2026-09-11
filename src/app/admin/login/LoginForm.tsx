"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <div className="flex flex-1 items-center justify-center px-5">
      <form action={action} className="card w-full max-w-sm p-8 grid gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <p className="eyebrow">Panel</p>
          <h1 className="font-display mt-2 text-3xl">Entrar</h1>
        </div>
        <input className="input" type="password" name="password" placeholder="Contraseña" required autoFocus autoComplete="current-password" />
        {state && !state.ok && <p className="text-sm text-danger">{state.message}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
