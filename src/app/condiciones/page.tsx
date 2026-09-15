import type { Metadata } from "next";
import Link from "next/link";
import { HOLD_MINUTES, MAX_SEATS_PER_RESERVATION, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Condiciones y privacidad · ${SITE_NAME}`,
  description: "Cómo funcionan las reservas, los cambios y qué hacemos con tus datos.",
};

export default function CondicionesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <p className="ap-eyebrow">{SITE_NAME}</p>
      <h1 className="ap-display mt-3 text-3xl sm:text-4xl">Condiciones y privacidad</h1>
      <p className="mt-3 text-sm text-muted">Lo importante, en corto. Cualquier duda, por WhatsApp (los números van en tu confirmación).</p>

      <div className="mt-10 space-y-8 leading-relaxed text-ink/90">
        <Block title="La reserva">
          <p>
            Se reserva por persona, hasta {MAX_SEATS_PER_RESERVATION} lugares por reserva, y se paga por Mercado Pago al momento de reservar.
            Mientras pagás, tu cupo queda guardado {HOLD_MINUTES} minutos; si el pago no se completa en ese tiempo, el cupo vuelve a quedar
            libre.
          </p>
          <p>La reserva queda confirmada cuando Mercado Pago aprueba el pago. Ahí te llegan por mail la dirección exacta y el link para elegir tu silla.</p>
        </Block>

        <Block title="Cambios y cancelaciones">
          <p>
            Son pocos lugares y cocinamos para las personas que reservaron, así que avisá con la mayor anticipación posible. Podés{" "}
            <strong>pasarle tu lugar a otra persona</strong> (nos decís el nombre por WhatsApp) o, si hay lugar, <strong>cambiar a otra fecha</strong>.
          </p>
          <p>Si somos nosotros los que tenemos que suspender una fecha, te devolvemos el total o te pasamos a la fecha que prefieras.</p>
        </Block>

        <Block title="Qué incluye">
          <p>
            El cóctel sin alcohol de recepción, los pasos de la cena con el cóctel que acompaña a cada uno, y agua en la mesa. Si no tomás
            alcohol, avisanos al reservar. Lo que quieras tomar además, de la barra, se paga aparte esa noche.
          </p>
          <p>Contanos alergias o si comés distinto al reservar: hay un campo para eso. Lo tenemos en cuenta antes de cocinar.</p>
        </Block>

        <Block title="La casa">
          <p>
            Es una casa particular, no un local: por eso la dirección exacta llega solo con la confirmación. Se recibe con un trago de pie; llegá a
            la hora indicada así arrancamos todos juntos.
          </p>
          <p>Las bebidas con alcohol son para mayores de 18 años.</p>
        </Block>

        <Block title="Tus datos">
          <p>
            Pedimos nombre, mail y WhatsApp solo para gestionar tu reserva y avisarte cosas de la cena. No los compartimos con nadie ni los
            usamos para publicidad de terceros. El pago lo procesa Mercado Pago: nosotros no vemos ni guardamos datos de tu tarjeta.
          </p>
          <p>
            Si te anotaste para enterarte de nuevas fechas, cada mail trae un link para darte de baja. Podés pedirnos ver, corregir o borrar tus
            datos cuando quieras (Ley 25.326).
          </p>
        </Block>
      </div>

      <p className="mt-12 text-center">
        <Link href="/" className="btn btn-ghost">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] text-muted">{children}</div>
    </section>
  );
}
