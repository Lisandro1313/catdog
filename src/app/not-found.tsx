import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="ap-eyebrow">{SITE_NAME}</p>
      <h1 className="ap-display mt-4 text-4xl sm:text-5xl">Esa puerta no existe</h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">El link que abriste no lleva a ningún lado. La cena sí existe: está en el inicio.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Ir al inicio
      </Link>
    </div>
  );
}
