import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CAPACITY, DEFAULT_PRICE, formatPrice, siteUrl } from "@/lib/config";
import { formatShort, nowMs, toDatetimeLocal } from "@/lib/dates";
import { isMercadoPagoConfigured } from "@/lib/mp";
import { isEmailConfigured } from "@/lib/email";
import { EventForm } from "@/components/admin/EventForm";
import { createEventAction } from "../actions";

export default async function AdminHome() {
  const [events, subscribers] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        reservations: { select: { status: true, expiresAt: true, quantity: true } },
      },
    }),
    prisma.subscriber.count(),
  ]);

  const url = siteUrl();
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#1a150d", light: "#f3ede4" } });

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  nextFriday.setHours(21, 0, 0, 0);

  const now = nowMs();

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <Status ok={isMercadoPagoConfigured()} label="Mercado Pago" hint="MP_ACCESS_TOKEN" />
        <Status ok={isEmailConfigured()} label="Emails (Resend)" hint="RESEND_API_KEY" />
        <div className="card p-4">
          <p className="text-xs text-muted">Suscriptores</p>
          <p className="font-display text-3xl">{subscribers}</p>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl">Nueva cena</h2>
        <div className="mt-4">
          <EventForm
            action={createEventAction}
            submitLabel="Crear cena"
            initial={{
              title: "",
              date: toDatetimeLocal(nextFriday),
              price: DEFAULT_PRICE,
              capacity: DEFAULT_CAPACITY,
              description: "",
              menu: "",
              address: "",
              published: true,
            }}
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl">Cenas</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-muted">Todavía no creaste ninguna.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {events.map((e) => {
              const paid = e.reservations.filter((r) => r.status === "PAID").reduce((n, r) => n + r.quantity, 0);
              const holding = e.reservations
                .filter((r) => r.status === "PENDING" && r.expiresAt.getTime() > now)
                .reduce((n, r) => n + r.quantity, 0);
              const past = e.date.getTime() < now;
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/eventos/${e.id}`} className="font-medium hover:text-accent">
                      {e.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatShort(e.date)} · {formatPrice(e.price)} · {e.capacity} lugares
                      {!e.published && " · borrador"}
                      {past && " · pasada"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      <span className="text-ok">{paid} pagos</span>
                      {holding > 0 && <span className="text-muted"> · {holding} en proceso</span>}
                    </p>
                    <p className="text-muted">{e.capacity - paid - holding} libres</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="w-40 shrink-0 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: qr }} />
        <div>
          <h2 className="font-display text-2xl">Para el flyer</h2>
          <p className="mt-2 text-muted text-sm">
            Este QR lleva al sitio. Clic derecho → guardar imagen, o copiá el link:
          </p>
          <p className="mt-2 font-mono text-sm break-all text-accent">{url}</p>
        </div>
      </section>
    </>
  );
}

function Status({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-medium ${ok ? "text-ok" : "text-danger"}`}>{ok ? "Configurado" : "Falta"}</p>
      {!ok && <p className="text-xs text-muted mt-1">Variable {hint}</p>}
    </div>
  );
}
