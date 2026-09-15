"use client";

import { useActionState, useRef, useState } from "react";
import { addPhotoAction, movePhotoAction, removePhotoAction, setAboutAction, setInstagramAction } from "@/app/admin/actions";
import { compressImage, replaceInputFile } from "@/lib/client-image";
import type { PhotoRow } from "@/lib/photos";

export function PhotosPanel({ photos }: { photos: PhotoRow[] }) {
  const [state, action, pending] = useActionState(addPhotoAction, null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formKey = state?.ok ? state.message : "form";

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return setPreview(null);
    const small = await compressImage(file, 2000, 0.85);
    if (small !== file) replaceInputFile(input, small);
    setPreview(URL.createObjectURL(small));
  }

  return (
    <div className="mt-4 grid gap-4">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <PhotoCard key={p.id} photo={p} index={i} total={photos.length} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Todavía no hay fotos. Con 4 o 5 buenas alcanza: la fachada, la mesa puesta, un plato, la barra.</p>
      )}

      <form key={formKey} action={action} className="grid gap-3 rounded-xl border border-line bg-surface-2 p-4">
        <p className="text-sm font-medium">Subir una foto</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn btn-ghost btn-sm cursor-pointer">
            📷 Elegir foto
            <input ref={inputRef} className="sr-only" type="file" name="photo" accept="image/*" onChange={onChange} required />
          </label>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
          )}
        </div>
        <input className="input" name="caption" placeholder="Pie de foto (opcional): La mesa, la barra, el pasillo…" maxLength={120} />
        {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
        <button className="btn btn-primary btn-sm justify-self-start" type="submit" disabled={pending || !preview}>
          {pending ? "Subiendo…" : "Subir al home"}
        </button>
      </form>
    </div>
  );
}

function PhotoCard({ photo, index, total }: { photo: PhotoRow; index: number; total: number }) {
  const [state, action, pending] = useActionState(removePhotoAction, null);
  const [confirm, setConfirm] = useState(false);
  if (state?.ok) return null;
  const isCover = index === 0;
  return (
    <li className={`overflow-hidden rounded-xl border bg-surface-2 ${isCover ? "border-accent/60" : "border-line"}`}>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption ?? ""} className="aspect-[4/3] w-full object-cover" />
        {isCover && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-[#1a150d]">Portada</span>}
      </div>
      <div className="flex items-center gap-1 px-2 pt-2 text-xs">
        {!isCover && (
          <form action={movePhotoAction}>
            <input type="hidden" name="id" value={photo.id} />
            <input type="hidden" name="where" value="portada" />
            <button className="text-accent hover:text-accent-strong" type="submit" title="Usar de portada (fondo del afiche)">
              ★ portada
            </button>
          </form>
        )}
        <span className="flex-1" />
        {index > 0 && (
          <form action={movePhotoAction}>
            <input type="hidden" name="id" value={photo.id} />
            <input type="hidden" name="where" value="adelante" />
            <button className="btn btn-ghost !min-h-0 px-2 py-0.5" type="submit" aria-label="Mover antes">
              ←
            </button>
          </form>
        )}
        {index < total - 1 && (
          <form action={movePhotoAction}>
            <input type="hidden" name="id" value={photo.id} />
            <input type="hidden" name="where" value="atras" />
            <button className="btn btn-ghost !min-h-0 px-2 py-0.5" type="submit" aria-label="Mover después">
              →
            </button>
          </form>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-2 text-xs">
        <span className="truncate text-muted">{photo.caption ?? "Sin pie de foto"}</span>
        {confirm ? (
          <form action={action} className="flex gap-1">
            <input type="hidden" name="id" value={photo.id} />
            <button className="text-danger" type="submit" disabled={pending}>
              {pending ? "…" : "Sí, borrar"}
            </button>
            <button className="text-muted" type="button" onClick={() => setConfirm(false)}>
              no
            </button>
          </form>
        ) : (
          <button className="text-muted hover:text-danger" type="button" onClick={() => setConfirm(true)}>
            borrar
          </button>
        )}
      </div>
    </li>
  );
}

export function InstagramPanel({ current }: { current: string }) {
  const [state, action, pending] = useActionState(setInstagramAction, null);
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs text-muted">
        Usuario de Instagram
        <div className="flex items-center gap-1">
          <span className="text-muted">@</span>
          <input className="input" name="instagram" defaultValue={current} placeholder="lacasadela66" maxLength={40} />
        </div>
      </label>
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <p className="basis-full text-xs text-muted">Aparece abajo del texto de “Quiénes somos” y en el pie del home. Vacío = no se muestra.</p>
      {state?.message && <p className={`basis-full text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function AboutPanel({ current, isDefault }: { current: string; isDefault: boolean }) {
  const [state, action, pending] = useActionState(setAboutAction, null);
  return (
    <form action={action} className="mt-4 grid gap-3">
      <textarea className="input" name="about" rows={8} defaultValue={current} maxLength={2000} />
      <p className="text-xs text-muted">
        {isDefault ? "Este es el texto de fábrica: escribí el de ustedes." : "Se muestra en el home, en la sección “Quiénes somos”."} Un párrafo por
        línea en blanco.
      </p>
      {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      <button className="btn btn-primary btn-sm justify-self-start" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
