"use client";

import { useActionState, useState } from "react";
import { changeOwnPasswordAction, createUserAction, deleteUserAction, resetUserPasswordAction } from "@/app/admin/actions";

type UserRow = { name: string; since: string };

export function UsersPanel({ users, me, suggested }: { users: UserRow[]; me: string | null; suggested: string[] }) {
  const [open, setOpen] = useState<null | "create" | { reset: string } | { delete: string } | "own">(null);

  return (
    <div className="mt-4 grid gap-4">
      {users.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {users.map((u) => (
            <li key={u.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium">
                  {u.name} {u.name === me && <span className="text-xs text-accent">(vos)</span>}
                </p>
                <p className="text-xs text-muted">desde {u.since}</p>
              </div>
              <div className="flex gap-2">
                {u.name === me ? (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen("own")}>
                    Cambiar mi contraseña
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen({ reset: u.name })}>
                    Cambiar contraseña
                  </button>
                )}
                <button className="btn btn-danger btn-sm" type="button" onClick={() => setOpen({ delete: u.name })}>
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setOpen("create")}>
          + Nuevo usuario
        </button>
      </div>

      {open === "create" && <CreateDialog suggested={suggested} onClose={() => setOpen(null)} />}
      {open === "own" && <OwnPasswordDialog onClose={() => setOpen(null)} />}
      {open && typeof open === "object" && "reset" in open && <ResetDialog name={open.reset} onClose={() => setOpen(null)} />}
      {open && typeof open === "object" && "delete" in open && <DeleteDialog name={open.delete} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <dialog
      ref={(d) => {
        if (d && !d.open) d.showModal();
      }}
      onClose={onClose}
      className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/60"
    >
      <p className="font-display text-2xl">{title}</p>
      {children}
    </dialog>
  );
}

function Msg({ state }: { state: { ok: boolean; message?: string } | null }) {
  if (!state?.message) return null;
  return <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>;
}

function CreateDialog({ suggested, onClose }: { suggested: string[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(createUserAction, null);
  return (
    <Dialog title="Nuevo usuario" onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <label className="grid gap-1 text-xs text-muted">
            Nombre
            <input className="input" name="name" list="sugeridos" defaultValue={suggested[0] ?? ""} required maxLength={40} autoComplete="off" />
            <datalist id="sugeridos">
              {suggested.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Contraseña para ese usuario
            <input className="input" name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Contraseña maestra (para autorizar)
            <input className="input" name="master" type="password" required autoComplete="off" />
          </label>
          <Msg state={state} />
          <div className="mt-1 flex gap-2">
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear usuario"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ResetDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(resetUserPasswordAction, null);
  return (
    <Dialog title={`Contraseña de ${name}`} onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <input type="hidden" name="name" value={name} />
          <label className="grid gap-1 text-xs text-muted">
            Contraseña nueva
            <input className="input" name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Contraseña maestra (para autorizar)
            <input className="input" name="master" type="password" required autoComplete="off" />
          </label>
          <Msg state={state} />
          <div className="mt-1 flex gap-2">
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Cambiar"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function OwnPasswordDialog({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, null);
  return (
    <Dialog title="Mi contraseña" onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <label className="grid gap-1 text-xs text-muted">
            Contraseña actual
            <input className="input" name="current" type="password" required autoComplete="current-password" />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Contraseña nueva
            <input className="input" name="password" type="password" required minLength={6} autoComplete="new-password" />
          </label>
          <Msg state={state} />
          <div className="mt-1 flex gap-2">
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Cambiar"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function DeleteDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(deleteUserAction, null);
  return (
    <Dialog title={`¿Borrar a ${name}?`} onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <input type="hidden" name="name" value={name} />
          <p className="text-sm text-muted">No va a poder entrar más con su usuario. Los movimientos que cargó quedan.</p>
          <label className="grid gap-1 text-xs text-muted">
            Contraseña maestra (para autorizar)
            <input className="input" name="master" type="password" required autoComplete="off" />
          </label>
          <Msg state={state} />
          <div className="mt-1 flex gap-2">
            <button className="btn btn-danger btn-sm" type="submit" disabled={pending}>
              {pending ? "Borrando…" : "Sí, borrar"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
