import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/config";
import { formatLong, nowMs } from "@/lib/dates";
import { canReview, displayName } from "@/lib/reviews";
import { ReviewForm } from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function OpinarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: { event: true, review: true } });
  if (!reservation) notFound();
  const open = canReview(reservation, nowMs());
  const next = open ? await prisma.event.findFirst({ where: { published: true, date: { gt: new Date() } }, orderBy: { date: "asc" }, select: { id: true, date: true } }) : null;

  return (
    <div className="flex flex-1 flex-col items-center px-5 py-12 sm:py-16">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <p className="eyebrow text-center">{SITE_NAME}</p>
        <h1 className="font-display mt-2 text-center text-3xl">
          {reservation.event.title}
          <span className="mt-1 block text-base font-normal text-muted">{formatLong(reservation.event.date)}</span>
        </h1>
        {open ? (
          <div className="mt-8">
            <ReviewForm
              next={next ? { id: next.id, label: formatLong(next.date) } : null}
              reservationId={reservation.id}
              defaultName={reservation.review?.name ?? displayName(reservation.name)}
              existing={reservation.review ? { rating: reservation.review.rating, text: reservation.review.text } : null}
            />
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-muted">
              {reservation.status === "PAID"
                ? "La cena todavía no pasó. Volvé después y contanos cómo la pasaste."
                : "Esta reserva no llegó a confirmarse."}
            </p>
            <Link href="/" className="btn btn-ghost mt-6">
              Ir al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
