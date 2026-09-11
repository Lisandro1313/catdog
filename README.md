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
- **Cenas:** crear / editar / despublicar (título, fecha, precio, lugares, descripción, pasos de la noche en formato `plato | trago`, carta de barra en formato `trago | descripción` con su precio por trago, dirección privada).
- **Reservas por cena:** marcar pagado a mano, cancelar (libera lugares, queda registro), **borrar** definitivamente (para pruebas o devoluciones ya resueltas), asignar o cambiar sillas, cargar reservas a mano (efectivo / transferencia / invitado).
- **Gastos (`/admin/gastos`)**: la pantalla del día a día, pensada para el celular. Se carga monto, rubro (verdulería, carnicería, almacén, bebidas, insumos, vajilla, alquiler, luz/gas/internet, viáticos, personal, otros), quién lo pagó y con qué plata (de su bolsillo o de la caja), detalle y fecha. También ingresos (barra, otros), **aportes** (un socio pone plata) y **retiros** (un socio se lleva plata).
- **Entre socios** (en la misma pantalla): ganancia acumulada, plata en el negocio, reserva para gastos fijos (editable) y, por socio, lo que puso, lo que le toca de ganancia, lo que ya retiró, lo que le deben, **lo que puede retirar hoy** y lo que queda pendiente. Regla: primero se devuelve lo que cada uno puso de su bolsillo, después la ganancia que supera la reserva se reparte en partes iguales; si la plata no alcanza, a prorrata y el resto queda para cuando entre.
- **¿Cómo venimos? (IA)**: botón que le manda todos los números a Claude (vía Vercel AI Gateway) y devuelve, en criollo: estado, resumen, proyección de la semana que viene, cubiertos para cubrir gastos, un mensaje por socio, alertas y qué hacer esta semana. Se guarda el último análisis. Cuesta centavos por análisis.
- **Esta semana** y **Semana a semana**: reservas (cuentan en la semana de la cena), barra, gastos y resultado; promedio de gastos y punto de equilibrio en cubiertos.
- **Caja por cena:** en la página de la cena, sección **Caja**, para lo puntual de esa noche (la barra al cierre, un insumo). Usa el mismo formulario.
- **Contactos:** todas las personas que pagaron alguna vez, una fila por email, con teléfono, cantidad de cenas, lugares, gasto total y última cena. Botón para descargar CSV.
- Botón "Avisar a suscriptores": manda el mail de nueva fecha a todos los anotados.
- QR + link del sitio para el flyer.

Las visitas se cuentan con un beacon desde las pantallas públicas (`/api/visita`), una por sesión de navegador, sin cookies ni datos personales. No cuenta las visitas al panel. El panel muestra el total y el desglose por página, así se ve qué link trae gente.

## Instalar el panel como app en el celular

El panel es una PWA. En el celular, abrí `https://catdog-omega.vercel.app/admin/gastos`, iniciá sesión y:

- **Android (Chrome):** menú ⋮ → "Instalar app" (o "Agregar a pantalla de inicio").
- **iPhone (Safari):** botón Compartir → "Agregar a inicio".

Queda como una app llamada "Panel" que abre directo en Gastos. Cada socio la instala en su teléfono y elige su nombre una vez (se recuerda).

## Activar la IA

El análisis usa Vercel AI Gateway con el modelo `anthropic/claude-opus-5`. En producción se autentica solo con el token de Vercel; no hace falta ninguna API key. Lo único que pide Vercel es **una tarjeta cargada en la cuenta** para desbloquear los créditos gratis del gateway:

1. Entrá a https://vercel.com/lisandro1313s-projects/~/ai (pestaña AI Gateway) y cargá una tarjeta cuando lo pida.
2. Listo: el botón "Analizar con IA" en `/admin/gastos` empieza a funcionar. No hay que redeployar.

Cada análisis cuesta del orden de $0,02 a $0,05 USD. Si en algún momento preferís una API key propia del gateway, cargala como `AI_GATEWAY_API_KEY`.

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
| `NEXT_PUBLIC_PARTNERS` | Nombres de los socios, separados por coma | Opcional (default "Lisandro,Agustín"). |
| `AI_GATEWAY_API_KEY` | Clave del AI Gateway | Opcional: en Vercel se usa el token OIDC del proyecto. |

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

- `Event`: una cena (fecha, precio, capacidad, publicado, menú, carta de barra y su precio, dirección).
- `Reservation`: nombre, email, cantidad de lugares, estado `PENDING | PAID | CANCELLED`, monto, vencimiento del hold, ids de Mercado Pago.
- `Seat`: una silla elegida por una reserva pagada. Única por evento, así dos personas no pueden agarrar la misma.
- `Subscriber`: emails anotados para enterarse de nuevas fechas.
- `LedgerEntry`: movimientos de caja: ingreso, gasto, aporte o retiro; rubro, detalle, monto, día, quién, si salió del bolsillo del socio o de la caja; opcionalmente atado a una cena.
- `Setting`: configuración editable desde el panel (`reserve` = reserva para gastos fijos; `ai:analysis` = último análisis de la IA).
- `PageView`: visitas al home agregadas por día.
