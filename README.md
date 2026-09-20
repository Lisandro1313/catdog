# CatDog · Cena a puertas cerradas

Sitio de reservas para una cena de 15 lugares. La gente entra, ve la próxima cena y su carta,
deja nombre y mail, paga (por transferencia con comprobante por WhatsApp, o con Mercado Pago cuando
esté activo), recibe la confirmación con la dirección y elige su silla. Vos administrás todo desde `/admin`.

## Stack

- Next.js 16 (App Router, Server Actions) + Tailwind 4, deploy en Vercel.
- Postgres en Neon (integración de Vercel Marketplace) con Prisma 7.
- Cobro por transferencia (alias + comprobante por WhatsApp, se confirma desde el panel) o Mercado Pago Checkout Pro (redirección + webhook), a elección desde Ajustes.
- Mails por Gmail (nodemailer) o Resend: lugar guardado, confirmación, recordatorio, opinión, nueva fecha, lista de espera.

## Pantallas públicas

- `/` — **el link que se comparte**. Una sola página larga, pensada primero para el celular, que va
  ganando confianza hasta la reserva: afiche ("Apertura" si es la primera cena, después "Próxima cena",
  con fecha, hora y cuenta regresiva), **la carta** con su trago por paso y la barra, **fotos de la casa** (se suben desde
  Ajustes; si no hay, la sección no aparece), **quiénes somos** (texto editable desde Ajustes), **dónde**
  (zona + mapa centrado en la cuadra, sin marcador ni número), **preguntas frecuentes** y la reserva, con
  barra fija abajo en el celular (se esconde mientras el formulario está a la vista) y un menú de anclas
  arriba en escritorio. Muestra la próxima cena publicada, así que se mantiene sola.
- **Cuando una fecha se llena** el afiche la marca "Agotado" y manda a reservar para la siguiente
  publicada; el formulario muestra las próximas fechas como botones (las llenas, tachadas). Si no hay
  ninguna con lugar, pide el mail para avisar. Para que esto funcione hay que tener cargada la cena
  siguiente: en la página de una cena, "Repetir la semana que viene" la copia siete días después.
- **Vista previa al compartir**: el link genera solo una imagen (`/opengraph-image`) con la próxima
  fecha, la carta y el precio, que WhatsApp e Instagram muestran debajo del link.
- **Opiniones**: después de la cena, cada persona que pagó puede dejar estrellas y una frase en
  `/opinar/[id de su reserva]` (el link va en el mail "¿cómo la pasaste?" y en su página de reserva).
  Quedan pendientes hasta que se aprueban desde el panel; las aprobadas salen en el home en
  "Lo que dicen los que vinieron" (con el promedio cuando hay tres o más).
- `/condiciones` — condiciones de reserva, cambios, qué incluye y privacidad. Linkeada desde el
  formulario ("Al reservar aceptás las condiciones") y el pie. **Es un borrador para revisar.**
- El mapa de la zona se carga recién cuando la sección se acerca a la pantalla (o al tocar "Ver el
  mapa"): son ~450 KB de JavaScript de Google que antes cargaban con la página.
- Botón "Compartir la cena": en el celular abre la hoja nativa (WhatsApp, etc.); en escritorio copia el texto.
- **Google**: el home lleva datos estructurados (`FoodEvent`: fecha, precio, disponibilidad, zona sin
  número) para que aparezca como evento en las búsquedas, más `robots.txt` y `sitemap.xml`.
  Páginas de error y "no encontrado" en criollo.
- `/fechas` — lista de todas las próximas fechas publicadas (día, carta resumida, precio, "pocos lugares" /
  "agotado") con botón Reservar que lleva al home con esa fecha ya elegida (`/?fecha=<id>`). Sin mesa ni cupos.
- El formulario recuerda nombre, mail y WhatsApp en el navegador de quien ya reservó una vez, así la
  semana siguiente reserva en dos toques.
- Si hay fotos cargadas, la primera queda de fondo del afiche, muy oscurecida, con el texto siempre por delante.
- `/apertura` — redirige a `/` (era la dirección vieja del afiche).

Ninguna de las dos muestra cuántos lugares quedan ni la capacidad de la mesa: dicen "pocos lugares" y
"últimos lugares" cuando quedan tres o menos. Tampoco dicen el número de la casa: en público es
"Calle 66, entre 2 y 3"; el número aparece solo después de pagar (página de la reserva y mail).

## Cómo funciona una reserva

1. El home muestra la **próxima cena publicada** (y, si se llenó, ofrece la siguiente) con los pasos de la noche y su trago.
2. El usuario elige **cuántos son** (hasta 4), completa nombre / email / WhatsApp, puede avisar algo (alergias, vegetariano, festejo) y toca "Reservar y pagar".
3. Según lo que esté elegido en Ajustes → **Cómo se cobra**:
   - **Transferencia** (el modo actual): se crea la reserva `PENDING`, el lugar queda guardado unas horas (configurable; nunca más allá de media hora antes de la cena) y la página de la reserva muestra el monto, el alias y el titular, con botones para mandar el comprobante por WhatsApp. A ustedes les llega un mail "Reserva a confirmar". Cuando ven el comprobante, en la cena tocan **Marcar pagado** y recién ahí sale la confirmación con la dirección. Las que vencen sin comprobante quedan en la lista como "Sin comprobante (vencida)" y se pueden marcar pagas igual.
   - **Mercado Pago**: se crea la reserva `PENDING` que **bloquea ese cupo 30 minutos** y se lo manda a Mercado Pago.
   Al elegir la silla, si son dos o más, el dibujo ya sugiere sillas seguidas (se pueden cambiar).
4. Mercado Pago avisa al webhook `/api/mp/webhook` (y además la página de retorno `/reserva/[id]` verifica el pago por si el webhook demora). Si está aprobado, la reserva pasa a `PAID`, salen los mails y **recién ahí elige su silla** en la mesa, desde esa misma página (el link va en el mail). Puede cambiarla hasta el día de la cena si hay lugar.
5. Si no paga en 30 minutos, el cupo vuelve a estar libre solo. Si la misma persona (mismo mail) vuelve a intentar mientras su reserva sigue en proceso, se la lleva al mismo pago en vez de bloquear más lugares; y una misma conexión no puede tener más de dos reservas sin pagar a la vez en una cena (para que nadie bloquee la mesa).
   En esa misma página, quien no puede ir puede **pasarle su lugar a otra persona** (nombre, mail, WhatsApp): las sillas y el pago quedan, la reserva pasa a su nombre, le llega la confirmación con la dirección y a ustedes un aviso. Hasta el inicio de la cena; no si ya se marcó "Llegó".
6. La dirección exacta solo la ve quien ya pagó (en la página de su reserva y en el mail). Esa página tiene además "qué pasa ahora", botones para agregar la cena a Google Calendar o bajar el `.ics` (`/reserva/[id]/calendario`, solo si está paga) y uno para avisar por WhatsApp a los que vienen. El mail de confirmación es una ficha: cena, cuándo, dónde (con número), lugares y monto, silla o link para elegirla, hora de llegada, pasos de la noche y los WhatsApp de consulta.
- Con transferencia, al reservar le llega el mail **"Tu lugar está guardado"** (alias, monto, hasta cuándo, botón de
  WhatsApp) además de verlo en la página; el panel muestra la reserva en **"Por confirmar"** en el inicio y en la cena,
  con "Marcar pagado" (pide confirmación y no deja sobrevender si el lugar venció y otro lo tomó).
- Si una fecha se agota, el home ofrece **lista de espera** (`Waitlist`, por fecha): cuando se libera un lugar
  (cancelación, borrado o hold vencido que limpia el cron) les llega "Se liberó un lugar" con link directo; es por orden
  de llegada. Quien paga queda anotado para enterarse de las próximas fechas.


## Panel `/admin`

- **Inicio:** qué cena está mostrando el home ahora (con pagos / en proceso / libres), estado de Mercado Pago y Resend, suscriptores, cubiertos vendidos, visitas al sitio (hoy, 7 y 30 días, gráfico de 14 días) y rendimiento global (reservas cobradas + barra − gastos).
- **Cenas:** crear / editar / despublicar / **cerrar reservas** (el sitio dice "reservas cerradas" y manda a la fecha siguiente; las pagas siguen igual; se puede reabrir) / **repetir la semana que viene** (copia sin publicar, siete días después, con la misma carta) (título, fecha, precio, lugares, descripción, pasos de la noche en formato `plato | trago`, carta de barra en formato `trago | descripción` con su precio por trago, dirección privada).
- **Reservas por cena:** marcar pagado a mano, cancelar (libera lugares, queda registro), **borrar** definitivamente (para pruebas o devoluciones ya resueltas), asignar o cambiar sillas, cargar reservas a mano (efectivo / transferencia / invitado).
- **Gastos (`/admin/gastos`)**: la pantalla del día a día, pensada para el celular. Se carga monto, rubro (verdulería, carnicería, almacén, bebidas, insumos, vajilla, alquiler, luz/gas/internet, viáticos, personal, otros), con qué plata (de su bolsillo o de la caja), detalle, fecha y **foto del comprobante** (abre la cámara; la foto se achica en el teléfono antes de subir y se guarda privada en Vercel Blob). También ingresos (barra, otros), **aportes** (un socio pone plata) y **retiros** (un socio se lleva plata; pide confirmación en una ventana).
- **Movimientos:** tocar uno abre una ventana con el detalle, la foto del comprobante y quién lo cargó / editó. Desde ahí se **edita** (monto, rubro, detalle, fecha, socio, con qué plata, foto) o se **borra** con confirmación. Lo borrado va a la **Papelera** (no cuenta en los números) y se puede restaurar. Nada se borra de verdad.
- **Gastos fijos** (en Ajustes): alquiler, luz, gas, internet con su monto mensual. Cada lunes el sistema carga solo, para cada fijo activo, un gasto por el prorrateo semanal (mensual × 12 ÷ 52) como gasto de la caja, firmado "sistema". Así la semana arranca en rojo y las cenas la tienen que llevar a verde. Se generan al abrir Gastos (no hace falta cron): si nadie abre el panel una semana, se completan las semanas que faltan al abrirlo. Editar el monto actualiza la semana actual si nadie la tocó; dar de baja deja de generar semanas nuevas y conserva las pasadas. Si un socio paga un fijo de su bolsillo, lo carga como **Aporte** para que se le devuelva.
- **Entre socios** (en la misma pantalla): ganancia acumulada, plata en el negocio, colchón opcional (plata que dejan sin repartir; los fijos ya se descuentan solos) y, por socio, lo que puso, lo que le toca de ganancia, lo que ya retiró, lo que le deben, **lo que puede retirar hoy** y lo que queda pendiente. Regla: primero se devuelve lo que cada uno puso de su bolsillo, después la ganancia que supera el colchón se reparte en partes iguales; si la plata no alcanza, a prorrata y el resto queda para cuando entre.
- **¿Cómo venimos?**: botón "Analizar" que lee todos los números y devuelve, en criollo: estado (bien / justos / rojo), resumen, proyección de la semana que viene, cubiertos para cubrir gastos, un mensaje por socio, alertas y qué hacer esta semana. **Por defecto lo hace el código con reglas: gratis, instantáneo, sin ningún servicio.** Si hay una clave de IA configurada, lo escribe un modelo (ver "Activar la IA"). Se guarda el último análisis con la fecha y el modo.
- **Esta semana** y **Semana a semana**: reservas (cuentan en la semana de la cena), barra, gastos y resultado; promedio de gastos y punto de equilibrio en cubiertos.
- **Caja por cena:** en la página de la cena, sección **Caja**, para lo puntual de esa noche (la barra al cierre, un insumo). Usa el mismo formulario.
- **Vista para la noche** (botón en la página de la cena; funciona **sin señal** con la última lista que cargó la app instalada, y se puede imprimir): lista para el celular en la puerta, ordenada por silla, con nombre, cantidad, teléfono (abre WhatsApp), si confirmó, lo que avisó (alergias, resaltado y resumido arriba "para la cocina") y el botón **Llegó** para marcar quién entró. Arriba: vienen / confirmaron / llegaron.
- **Los mails que salen** (en Ajustes): vista previa de los cuatro mails (confirmación, recordatorio, ¿cómo la pasaste?, nueva fecha) con la próxima cena y datos de ejemplo.
- **Opiniones** (en la página de cada cena, cuando ya pasó): botón "Pedir opiniones por mail" (un mail con link personal a cada persona que pagó) y la lista de opiniones recibidas con **Publicar / Ocultar / Borrar**. Solo las publicadas salen en el home.
- **Instagram** (en Ajustes, bajo Quiénes somos): el usuario, sin la @. Aparece en el home; vacío no se muestra.
- Si se **cancela** una reserva paga desde el panel, la persona recibe un mail que lo confirma y la invita a escribir por WhatsApp (la devolución se conversa ahí). Cuando alguien deja una **opinión**, les llega un aviso por mail para publicarla. El mail de **nueva fecha** a suscriptores lleva la carta.
- **Fotos del lugar y Quiénes somos** (en Ajustes): las fotos se ordenan con ← → y "★ portada" elige la que va de fondo del afiche. se suben fotos de la casa (se achican en el teléfono antes de subir, se guardan públicas en Blob) con un epígrafe opcional, y se edita el texto de "Quiénes somos" que sale en el home. Sin fotos, el home no muestra la sección.
- **Contactos:** todas las personas que pagaron alguna vez, una fila por email, con teléfono, cantidad de cenas, lugares, gasto total y última cena. Botón para descargar CSV.
- El aviso "Nueva reserva" que les llega por mail dice si la confirmación a la persona salió bien; si falló, lo marca en rojo para que le avisen por WhatsApp.
- Botón "Avisar a suscriptores": manda el mail de nueva fecha a todos los anotados.
- QR + link del sitio para el flyer, y **afiches para redes** que se arman solos con la próxima cena: historia de Instagram / estado de WhatsApp (1080×1920, `/api/afiche?f=historia`) y cuadrado (1080×1080, `/api/afiche?f=cuadrado`). Se abren en otra pestaña y se guardan como imagen.
- **Antes de abrir**: lista en el inicio del panel con lo que falta (cobros reales, mails, fotos, Quiénes somos, Instagram, fecha siguiente publicada). Desaparece cuando está todo.

Las visitas se cuentan con un beacon desde las pantallas públicas (`/api/visita`), una por sesión de navegador, sin cookies ni datos personales. Cada vez que alguien toca "Reservar y pagar" se cuenta un intento (`/reservar`): el inicio del panel muestra el embudo visitas → intentos → pagos. No cuenta las visitas al panel ni las hechas desde `npm run dev` (la base es la misma que en producción). El panel muestra el total y el desglose por página, así se ve qué link trae gente.

## Tareas automáticas (cron de Vercel, gratis)

Una vez por día, a las 11 de la mañana (Argentina), Vercel llama a `/api/cron/diario` (configurado en
`vercel.json`, protegido con `CRON_SECRET`). Hace tres cosas, todas idempotentes:

1. **Recordatorio el día anterior** a cada persona que pagó (en la página de la cena hay un botón "Mandar recordatorio ahora" por si querés adelantarlo o la tarea no corrió): fecha, hora, dirección con número, su silla
   (o el link para elegirla) y dos botones: **"Confirmo que voy"** (un toque, sin login; queda marcado en
   el panel como "✓ confirmó que viene") y **"No voy a poder"** (abre WhatsApp con el mensaje armado).
   En la página de la cena se ve cuántos lugares confirmaron.
2. **Pedido de opiniones** al día siguiente de cada cena (si no se pidió a mano antes).
3. **Gastos fijos** de la semana, por si nadie abrió el panel.
4. **Borrador de la cena siguiente**: si la última ya pasó y no hay ninguna cargada, deja una copia siete días después, sin publicar, para revisar y publicar.

Si hace falta correrlo a mano: `curl -H "Authorization: Bearer $CRON_SECRET" https://catdog-omega.vercel.app/api/cron/diario`.

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
| `MP_ACCESS_TOKEN` | Cobrar. **Con un token `TEST-` los pagos no son reales**: el panel lo avisa en rojo. | [Panel de desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app) → tu aplicación → **Credenciales de producción** → Access Token (empieza con `APP_USR-`). |
| `MP_WEBHOOK_SECRET` | Verificar que las notificaciones vienen de MP (opcional pero recomendado) | Misma app → **Webhooks** → configurar URL `https://TU-DOMINIO/api/mp/webhook`, evento "Pagos" → copiar la **clave secreta**. |
| `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Mandar mails por Gmail (gratis, sin dominio propio) | Ver "Mails por Gmail" abajo. Si están cargadas, tienen prioridad sobre Resend. |
| `RESEND_API_KEY` | Mandar mails por Resend | La carga sola la integración Resend de Vercel (ver abajo). **Sin dominio verificado solo manda a tu propia casilla**: la gente no recibe la confirmación. |
| `EMAIL_FROM` | Remitente en Resend | Solo cuando hay dominio verificado en Resend, p. ej. `CatDog <hola@tudominio.ar>`. |
| `CRON_SECRET` | Protege la tarea diaria | Ya seteada (valor aleatorio). Vercel la manda sola al llamar al cron. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Mail de contacto que se muestra en el sitio | Opcional: si no está, se muestra la casilla de Gmail que manda los mails. |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio | Ya seteada: `https://catdog-omega.vercel.app`. Se usa en los links de vuelta de Mercado Pago, mails y vista previa. **Cambiarla cuando haya dominio propio.** |
| `ADMIN_EMAIL` | A dónde te avisamos cada reserva pagada | Tu mail. |
| `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_SITE_TAGLINE` | Nombre y subtítulo | Opcionales (default "CatDog" / "Cena a puertas cerradas"). |
| `NEXT_PUBLIC_PARTNERS` | Nombres de los socios, separados por coma | Opcional (default "Lisandro,Agustín"). |
| `GOOGLE_GENERATIVE_AI_API_KEY` | IA gratis (Gemini) para el análisis | Opcional: https://aistudio.google.com/apikey |
| `AI_GATEWAY_API_KEY` | IA con Claude vía Vercel AI Gateway | Opcional; requiere tarjeta en Vercel. |
| `BLOB_READ_WRITE_TOKEN` | Fotos de comprobantes | Ya cargada por el store de Vercel Blob. |

Después de agregar variables hay que volver a desplegar: `vercel deploy --prod`.

## Mails por Gmail (gratis, sin dominio)

Mientras no haya dominio propio, la forma de que **la gente reciba** la confirmación es mandar desde
una cuenta de Gmail (hasta 500 mails por día, de sobra):

1. Entrá a la cuenta de Gmail que va a mandar (puede ser una nueva tipo `cenas.catdog@gmail.com`).
2. Activá la **verificación en dos pasos**: https://myaccount.google.com/security
3. Creá una **contraseña de aplicación**: https://myaccount.google.com/apppasswords → nombre "CatDog"
   → te da 16 letras.
4. Cargá las dos variables en Vercel (Settings → Environment Variables, o por terminal):
   `GMAIL_USER` = la casilla, `GMAIL_APP_PASSWORD` = esas 16 letras (sin espacios).
5. Redeploy. En Ajustes → "Estado de los servicios" tiene que decir "Mails · Gmail (…)" en verde.

Los mails salen como "CatDog <tu casilla>". Las respuestas de la gente te llegan a esa casilla.
Todos los mails van con versión en texto plano (mejor entrega) y la confirmación lleva la invitación de
calendario (.ics): en Gmail aparece la tarjeta "Agregar al calendario".

## Activar Resend

La instalación quedó a mitad porque hay que aceptar los términos en el navegador:

1. Abrí https://vercel.com/lisandro1313s-projects/~/integrations/accept-terms/resend?source=cli y aceptá.
2. Corré `vercel integration add resend/resend-email --no-claim --name catdog-mail` (carga `RESEND_API_KEY` sola).
3. `vercel deploy --prod`.

## Carta de la barra en PDF (para imprimir y plastificar)

`node scripts/carta-tragos.mjs` genera `exports/carta-tragos-oscura.pdf` y `exports/carta-tragos-clara.pdf` (A4)
a partir de `scripts/carta-tragos.json` (secciones, tragos, descripciones y precios: se editan ahí). Si existe
`fotos/qr-mp.png` (el QR de cobro bajado de la app de Mercado Pago), va ese QR; si no, un QR que muestra el alias.
Usa el Chrome instalado para imprimir a PDF.

## El juego de las mesitas (`/hoy`) — "Puertas adentro"

Un QR por mesita (se imprimen en `/admin/mesitas`, tarjetas A6) abre `/hoy/N`. No lleva a la carta: muestra
la cena de esa noche como una función en actos (el cóctel de recepción y cada paso). Cada acto es una carta
que se da vuelta: por qué va ese trago con ese plato, y un ingrediente escondido para adivinar entre cuatro
fichas. Se apuesta 1 o 3 ✦, se "sella y destapa" y recién ahí el servidor devuelve el secreto. Al final,
"Fin de la función" con el puntaje y la lista de secretos. Todo es opcional, individual y a su ritmo: el QR
está ahí "vago", nadie lo anuncia ni hay momentos en conjunto.

- Los secretos se cargan por cena, en **Reservas y carta → "Lo que la carta no dice"** (cóctel de recepción,
  ingrediente escondido + 3 señuelos + una línea de por qué). Si falta algo, el juego se muestra igual con
  ejemplos ("modo ejemplo").
- `/hoy/demo` sirve para probarlo cualquier día con la próxima cena. Fuera de la noche real un invitado nunca ve
  secretos de verdad de una cena futura (solo el admin, con `?e=<id>` y sesión).
- La cena está "en vivo" desde 3 horas antes de su hora hasta 10 después; antes de eso el QR juega con ejemplos.
- La apuesta tiene riesgo: acertar suma lo apostado (1 o 3 ✦); errar con 3 ✦ resta 1. En la noche real, el mazo muestra
  "La sala": puntos por mesita (nunca cantidades de gente), para que las mesas compitan sin coordinar nada.
- Las apuestas (`Guess`) se guardan solo la noche de la cena, por teléfono (cookie anónima `catdog_hoy_device`), y
  sirven para el "el 40 % de la casa acertó" (solo porcentajes y con 3 apuestas o más; nunca cantidades).
- **Ajustes → El juego de las mesitas** lo apaga por hoy (`hoy:off`): el QR muestra solo la carta y la barra.
- Sin cena esa noche, el QR muestra la próxima con ejemplos; sin ninguna cena con carta, "Hoy no hay función".

## Entretenimiento (`/hoy/jugar`)

Siete juegos sueltos para la espera, linkeados desde el mazo de "Puertas adentro": **maridaje** (cada plato de la
noche con su cóctel, con la carta real), **memotest** con las fotos de la
casa (8 pares), **atrapá al chef** (la cara de Agustín, `public/chef.png`, se desliza por la cocina cada vez más
chica y rápida; 30 segundos; tres seguidos dan bonus; si está rojo, resta), **llená la copa** (mantener apretado
para servir y soltar en la línea; cinco copas), **Simón de la barra** (repetir la secuencia de ingredientes),
**mímica** para la mesa (consignas de cocina y barra más los platos y tragos de la noche; un minuto) y
**verdadero o falso** de barra (16 preguntas en `src/lib/jugar.ts`, 8 por ronda).

- Las **marcas** se guardan en el servidor por teléfono (`GameScore`, cookie anónima `catdog_hoy_device`), y el
  jugador puede anotarse con un nombre: sale en la **tabla de récords** (top 5 por juego, dentro de cada juego y en
  "Récords ›" del hub). Los nombres se moderan en **Panel → Premios** ("Borrar nombre": la marca queda anónima).
- El **premio** (un trago) lo emite el servidor solo la noche de una cena (cena "en vivo"), cuando el teléfono logró
  esa noche las metas de **6 de los 7** juegos (`METAS` y `PREMIO_MINIMO` en `src/lib/juegos.ts`; la mímica necesita
  mesa, por eso no es obligatoria): un código por teléfono y por noche (`Prize`), que se canjea desde **Panel →
  Premios** ("Canjear", queda quién lo canjeó). Las marcas son por noche (`GameScore.day`); los récords miran todas.
- Los valores imposibles se descartan (`plausible`); igual las marcas las manda el teléfono, así que el premio es
  "difícil de conseguir" más que "imposible de trucar": para una mesa de amigos alcanza.

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
- `Reservation`: nombre, email, cantidad de lugares, aviso opcional (alergias, etc.), recordatorio enviado y asistencia confirmada, estado `PENDING | PAID | CANCELLED`, monto, vencimiento del hold, ids de Mercado Pago.
- `Seat`: una silla elegida por una reserva pagada. Única por evento, así dos personas no pueden agarrar la misma.
- `Subscriber`: emails anotados para enterarse de nuevas fechas.
- `LedgerEntry`: movimientos de caja: ingreso, gasto, aporte o retiro; rubro, detalle, monto, día, quién, si salió del bolsillo del socio o de la caja; opcionalmente atado a una cena.
- `Setting`: configuración editable desde el panel (`reserve` = colchón que no se reparte; `ai:analysis` = último análisis de la IA; `about` = texto de "Quiénes somos"; `instagram` = usuario).
- `Review`: opinión de una reserva pagada (una por reserva): nombre para mostrar, estrellas, texto, aprobada o no.
- `Photo`: fotos del lugar para el home (URL pública en Blob, epígrafe, orden).
- `FixedExpense`: gastos fijos mensuales; sus entradas semanales en `LedgerEntry` llevan `fixedExpenseId` + `periodKey` (lunes) únicos, para no duplicar.
- `User`: usuarios del panel (nombre y contraseña con hash scrypt). La sesión es una cookie firmada con `APP_SECRET` (o `ADMIN_PASSWORD`).
- Los comprobantes viven en el store privado de Vercel Blob `catdog-comprobantes` (variable `BLOB_READ_WRITE_TOKEN`, ya cargada) y se sirven solo con sesión desde `/admin/comprobante/[id]`.
- `PageView`: visitas al home agregadas por día.
- `EventStep`: por cena y acto (0 = cóctel de recepción), el ingrediente escondido, los señuelos y el por qué del trago. `Event.welcomeDrink` es el cóctel de recepción ("nombre | frase").
- `Guess`: una apuesta por teléfono y acto en la cena en vivo (ficha elegida, 1 o 3 ✦, acierto, mesita).
