# CatDog · Cena a puertas cerradas

Sitio de reservas para una cena de 15 lugares. La gente entra, ve la semana de la
próxima cena, elige su silla en la mesa, deja nombre y mail, paga con Mercado Pago
y recibe la confirmación. Vos administrás todo desde `/admin`.

## Stack

- Next.js 16 (App Router, Server Actions) + Tailwind 4, deploy en Vercel.
- Postgres en Neon (integración de Vercel Marketplace) con Prisma 7.
- Mercado Pago Checkout Pro (redirección + webhook).
- Resend para mails (confirmación al que reserva, aviso a vos, aviso de nueva fecha a suscriptores).

## Pantallas públicas

- `/` — **el link que se comparte**. Pantalla de afiche para la apertura: "Apertura" en grande, la fecha
  como pieza gráfica, el menú gigante y tenue de fondo, la carta completa y la reserva abajo, con barra
  fija en el celular. Muestra la próxima cena publicada, así que se mantiene sola.
- `/fechas` — la versión de siempre: la semana de la próxima cena, los pasos, la reserva y el dibujo de la mesa.
- `/apertura` — redirige a `/` (era la dirección vieja del afiche).

Ninguna de las dos muestra cuántos lugares quedan ni la capacidad de la mesa: dicen "pocos lugares" y
"últimos lugares" cuando quedan tres o menos.

## Cómo funciona una reserva

1. El home muestra **solo la próxima cena publicada**, su semana (lunes a domingo) y los pasos de la noche con su trago.
2. El usuario elige **cuántos son** (hasta 4), completa nombre / email / WhatsApp y toca "Reservar y pagar".
3. Se crea una reserva `PENDING` que **bloquea ese cupo 30 minutos** y se lo manda a Mercado Pago.
4. Mercado Pago avisa al webhook `/api/mp/webhook` (y además la página de retorno `/reserva/[id]` verifica el pago por si el webhook demora). Si está aprobado, la reserva pasa a `PAID`, salen los mails y **recién ahí elige su silla** en la mesa, desde esa misma página (el link va en el mail). Puede cambiarla hasta el día de la cena si hay lugar.
5. Si no paga en 30 minutos, el cupo vuelve a estar libre solo.
6. La dirección exacta solo la ve quien ya pagó (en la página de su reserva y en el mail).

## Panel `/admin`

- **Inicio:** qué cena está mostrando el home ahora (con pagos / en proceso / libres), estado de Mercado Pago y Resend, suscriptores, cubiertos vendidos, visitas al sitio (hoy, 7 y 30 días, gráfico de 14 días) y rendimiento global (reservas cobradas + barra − gastos).
- **Cenas:** crear / editar / despublicar (título, fecha, precio, lugares, descripción, pasos de la noche en formato `plato | trago`, dirección privada).
- **Reservas por cena:** marcar pagado a mano, cancelar (libera lugares, queda registro), **borrar** definitivamente (para pruebas o devoluciones ya resueltas), asignar o cambiar sillas, cargar reservas a mano (efectivo / transferencia / invitado).
- **Caja por cena:** ingresos (barra, otros) y gastos (insumos, bebidas, personal, otros) con detalle y monto. Muestra reservas cobradas, barra, gastos y resultado.
- **Contactos:** todas las personas que pagaron alguna vez, una fila por email, con teléfono, cantidad de cenas, lugares, gasto total y última cena. Botón para descargar CSV.
- Botón "Avisar a suscriptores": manda el mail de nueva fecha a todos los anotados.
- QR + link del sitio para el flyer.

Las visitas se cuentan con un beacon desde las pantallas públicas (`/api/visita`), una por sesión de navegador, sin cookies ni datos personales. No cuenta las visitas al panel. El panel muestra el total y el desglose por página, así se ve qué link trae gente.

## Variables de entorno

Las de la base ya las carga la integración de Neon. Faltan estas (se setean con
`vercel env add NOMBRE production`):

| Variable | Para qué | Cómo conseguirla |
|---|---|---|
| `ADMIN_PASSWORD` | Entrar a `/admin` | Ya está seteada (ver mensaje de entrega). Cambiala con `vercel env rm ADMIN_PASSWORD production` + `vercel env add`. |
| `APP_SECRET` | Firmar links de baja de mails | Ya está seteada. |
| `MP_ACCESS_TOKEN` | Cobrar | [Panel de desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app) → tu aplicación → **Credenciales de producción** → Access Token (empieza con `APP_USR-`). |
| `MP_WEBHOOK_SECRET` | Verificar que las notificaciones vienen de MP (opcional pero recomendado) | Misma app → **Webhooks** → configurar URL `https://TU-DOMINIO/api/mp/webhook`, evento "Pagos" → copiar la **clave secreta**. |
| `RESEND_API_KEY` | Mandar mails | La carga sola la integración Resend de Vercel (ver abajo). |
| `EMAIL_FROM` | Remitente | Sin dominio verificado dejá `CatDog <onboarding@resend.dev>` (solo manda a tu propia casilla). Para mandarle a la gente hay que verificar un dominio en Resend. |
| `ADMIN_EMAIL` | A dónde te avisamos cada reserva pagada | Tu mail. |
| `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_SITE_TAGLINE` | Nombre y subtítulo | Opcionales (default "CatDog" / "Cena a puertas cerradas"). |

Después de agregar variables hay que volver a desplegar: `vercel deploy --prod`.

## Activar Resend

La instalación quedó a mitad porque hay que aceptar los términos en el navegador:

1. Abrí https://vercel.com/lisandro1313s-projects/~/integrations/accept-terms/resend?source=cli y aceptá.
2. Corré `vercel integration add resend/resend-email --no-claim --name catdog-mail` (carga `RESEND_API_KEY` sola).
3. `vercel deploy --prod`.

## Desarrollo local

```bash
vercel env pull        # baja .env.local
npm install
npx prisma generate
npm run dev
```

Migraciones: `npm run db:migrate` (crea y aplica). En Vercel el build corre `prisma migrate deploy` solo.

## Modelo de datos

- `Event`: una cena (fecha, precio, capacidad, publicado).
- `Reservation`: nombre, email, cantidad de lugares, estado `PENDING | PAID | CANCELLED`, monto, vencimiento del hold, ids de Mercado Pago.
- `Seat`: una silla elegida por una reserva pagada. Única por evento, así dos personas no pueden agarrar la misma.
- `Subscriber`: emails anotados para enterarse de nuevas fechas.
- `LedgerEntry`: movimientos de caja de una cena (ingreso o gasto, rubro, detalle, monto).
- `PageView`: visitas al home agregadas por día.
