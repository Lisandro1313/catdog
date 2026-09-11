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
- **Gastos (`/admin/gastos`)**: la pantalla del día a día, pensada para el celular. Se carga monto, rubro (verdulería, carnicería, almacén, bebidas, insumos, vajilla, alquiler, luz/gas/internet, viáticos, personal, otros), con qué plata (de su bolsillo o de la caja), detalle, fecha y **foto del comprobante** (abre la cámara; la foto se achica en el teléfono antes de subir y se guarda privada en Vercel Blob). También ingresos (barra, otros), **aportes** (un socio pone plata) y **retiros** (un socio se lleva plata; pide confirmación en una ventana).
- **Movimientos:** tocar uno abre una ventana con el detalle, la foto del comprobante y quién lo cargó / editó. Desde ahí se **edita** (monto, rubro, detalle, fecha, socio, con qué plata, foto) o se **borra** con confirmación. Lo borrado va a la **Papelera** (no cuenta en los números) y se puede restaurar. Nada se borra de verdad.
- **Gastos fijos** (en Ajustes): alquiler, luz, gas, internet con su monto mensual. Cada lunes el sistema carga solo, para cada fijo activo, un gasto por el prorrateo semanal (mensual × 12 ÷ 52) como gasto de la caja, firmado "sistema". Así la semana arranca en rojo y las cenas la tienen que llevar a verde. Se generan al abrir Gastos (no hace falta cron): si nadie abre el panel una semana, se completan las semanas que faltan al abrirlo. Editar el monto actualiza la semana actual si nadie la tocó; dar de baja deja de generar semanas nuevas y conserva las pasadas. Si un socio paga un fijo de su bolsillo, lo carga como **Aporte** para que se le devuelva.
- **Entre socios** (en la misma pantalla): ganancia acumulada, plata en el negocio, colchón opcional (plata que dejan sin repartir; los fijos ya se descuentan solos) y, por socio, lo que puso, lo que le toca de ganancia, lo que ya retiró, lo que le deben, **lo que puede retirar hoy** y lo que queda pendiente. Regla: primero se devuelve lo que cada uno puso de su bolsillo, después la ganancia que supera el colchón se reparte en partes iguales; si la plata no alcanza, a prorrata y el resto queda para cuando entre.
- **¿Cómo venimos?**: botón "Analizar" que lee todos los números y devuelve, en criollo: estado (bien / justos / rojo), resumen, proyección de la semana que viene, cubiertos para cubrir gastos, un mensaje por socio, alertas y qué hacer esta semana. **Por defecto lo hace el código con reglas: gratis, instantáneo, sin ningún servicio.** Si hay una clave de IA configurada, lo escribe un modelo (ver "Activar la IA"). Se guarda el último análisis con la fecha y el modo.
- **Esta semana** y **Semana a semana**: reservas (cuentan en la semana de la cena), barra, gastos y resultado; promedio de gastos y punto de equilibrio en cubiertos.
- **Caja por cena:** en la página de la cena, sección **Caja**, para lo puntual de esa noche (la barra al cierre, un insumo). Usa el mismo formulario.
- **Contactos:** todas las personas que pagaron alguna vez, una fila por email, con teléfono, cantidad de cenas, lugares, gasto total y última cena. Botón para descargar CSV.
- Botón "Avisar a suscriptores": manda el mail de nueva fecha a todos los anotados.
- QR + link del sitio para el flyer.

Las visitas se cuentan con un beacon desde las pantallas públicas (`/api/visita`), una por sesión de navegador, sin cookies ni datos personales. No cuenta las visitas al panel. El panel muestra el total y el desglose por página, así se ve qué link trae gente.

## Usuarios: uno para cada socio

En **Ajustes** (`/admin/ajustes`) se crean los usuarios. Cada socio entra con su nombre y su contraseña, y todo lo que carga, edita o borra queda firmado con su nombre. Para crear usuarios, cambiarles la contraseña o borrarlos hay que escribir la **contraseña maestra** (la variable `ADMIN_PASSWORD`), así ninguno de los dos puede tocar la cuenta del otro sin ella. Cada uno puede cambiar su propia contraseña con la actual.

La contraseña maestra siempre sigue entrando (opción "Entrar con la contraseña maestra" en el login), por si alguien se olvida la suya. Entrando con la maestra, el formulario pregunta a nombre de quién se carga cada gasto.

Pasos la primera vez: entrar con la maestra → Ajustes → "+ Nuevo usuario" → Lisandro con su contraseña → otra vez para Agustín → cerrar sesión → cada uno entra con el suyo (y lo instala como app en su teléfono).

## Instalar el panel como app en el celular

El panel es una PWA. En el celular, abrí `https://catdog-omega.vercel.app/admin/gastos`, iniciá sesión y:

- **Android (Chrome):** menú ⋮ → "Instalar app" (o "Agregar a pantalla de inicio").
- **iPhone (Safari):** botón Compartir → "Agregar a inicio".

Queda como una app llamada "Panel" que abre directo en Gastos. Cada socio la instala en su teléfono y elige su nombre una vez (se recuerda).

## Activar la IA (opcional, y gratis)

El análisis funciona sin IA, por reglas. Si querés que lo escriba un modelo, la opción gratis es **Gemini de Google**, que tiene nivel gratuito sin tarjeta (modelos Flash, 1.500 pedidos por día; acá se usa uno por análisis):

1. Entrá a https://aistudio.google.com/apikey con tu cuenta de Google y creá una clave.
2. Cargala en Vercel:
   ```bash
   vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
   ```
3. Redeploy (`vercel deploy --prod` o cualquier push). En Ajustes va a decir "IA (Gemini, gratis)".

Usa el alias `gemini-flash-latest` (siempre el Flash más nuevo) y, si falla, prueba `gemini-3.8-flash` y `gemini-2.5-flash`. Si la clave no anda o se agota el cupo, el análisis se hace por reglas y avisa.

Aclaración: en el nivel gratuito, Google puede usar lo que le mandás para mejorar sus productos. Lo que se le manda son los números agregados (totales, semanas, cuentas entre socios), no nombres de clientes ni fotos.

Alternativa con Claude (más capaz, pero no gratis): Vercel AI Gateway con `AI_GATEWAY_API_KEY`. Vercel exige una tarjeta cargada en la cuenta para habilitarlo; después regala créditos mensuales y cada análisis cuesta centavos.

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
| `GOOGLE_GENERATIVE_AI_API_KEY` | IA gratis (Gemini) para el análisis | Opcional: https://aistudio.google.com/apikey |
| `AI_GATEWAY_API_KEY` | IA con Claude vía Vercel AI Gateway | Opcional; requiere tarjeta en Vercel. |
| `BLOB_READ_WRITE_TOKEN` | Fotos de comprobantes | Ya cargada por el store de Vercel Blob. |

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
- `Setting`: configuración editable desde el panel (`reserve` = colchón que no se reparte; `ai:analysis` = último análisis de la IA).
- `FixedExpense`: gastos fijos mensuales; sus entradas semanales en `LedgerEntry` llevan `fixedExpenseId` + `periodKey` (lunes) únicos, para no duplicar.
- `User`: usuarios del panel (nombre y contraseña con hash scrypt). La sesión es una cookie firmada con `APP_SECRET` (o `ADMIN_PASSWORD`).
- Los comprobantes viven en el store privado de Vercel Blob `catdog-comprobantes` (variable `BLOB_READ_WRITE_TOKEN`, ya cargada) y se sirven solo con sesión desde `/admin/comprobante/[id]`.
- `PageView`: visitas al home agregadas por día.
