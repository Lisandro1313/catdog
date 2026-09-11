"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";

export function LoginForm({ next, users }: { next: string; users: string[] }) {
  const [state, action, pending] = useActionState(loginAction, null);
  const [who, setWho] = useState<string>(users[0] ?? "");
  const [master, setMaster] = useState(users.length === 0);

  return (
    <div className="flex flex-1 items-center justify-center px-5">
      <form action={action} className="card w-full max-w-sm p-8 grid gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <input type="hidden" name="user" value={master ? "" : who} />
        <div>
          <p className="eyebrow">Panel</p>
          <h1 className="font-display mt-2 text-3xl">{master ? "Entrar" : "¿Quién sos?"}</h1>
        </div>

        {!master && users.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWho(u)}
                aria-pressed={who === u}
                className={`rounded-xl border px-3 py-3 text-base font-medium transition-colors ${
                  who === u ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface-2 text-muted"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        )}

        <input
          className="input"
          type="password"
          name="password"
          placeholder={master ? "Contraseña maestra" : "Tu contraseña"}
          required
          autoFocus
          autoComplete="current-password"
        />
        {state && !state.ok && <p className="text-sm text-danger">{state.message}</p>}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </button>

        {users.length > 0 && (
          <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setMaster((m) => !m)}>
            {master ? "← Entrar con mi usuario" : "Entrar con la contraseña maestra"}
          </button>
        )}
      </form>
    </div>
  );
}
