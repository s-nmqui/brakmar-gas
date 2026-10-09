# BrakMar Gas

Sitio web de BrakMar Gas — venta, carga y distribución de garrafas y accesorios en Belén, Salto, Uruguay.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- SQLite embebida (`node:sqlite`) — sin dependencias de runtime adicionales
- Pedidos vía WhatsApp (`wa.me`), sin procesamiento de pagos en la web

## Requisitos

- Node.js **22.5+** (por `node:sqlite`) — recomendado 24.x

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completá ADMIN_USERNAME, ADMIN_PASSWORD y SESSION_SECRET
npm run dev
```

Abrí http://localhost:3000. La base de datos SQLite se crea sola en `data/brakmar.db` con datos de ejemplo (productos, categorías, preguntas frecuentes). El catálogo inicial usa precios "a consultar" de forma intencional.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `ADMIN_USERNAME` | sí | Usuario administrador inicial (se crea la primera vez) |
| `ADMIN_PASSWORD` | sí | Contraseña. Mínimo 10 caracteres |
| `SESSION_SECRET` | en producción | Secreto para firmar la sesión, mínimo 32 caracteres |
| `NEXT_PUBLIC_SITE_URL` | no | URL pública del sitio para sitemap/robots/metadatos |
| `DATABASE_PATH` | no | Ruta alternativa del archivo SQLite |

> En producción `SESSION_SECRET` es obligatorio: si falta, la aplicación lanza un error al iniciar. Generalo con `openssl rand -hex 32`.

## Administración

El panel está en `/admin`. Las credenciales se definen con `ADMIN_USERNAME` / `ADMIN_PASSWORD` (sin credenciales hardcodeadas).

Secciones del panel:

- **Productos**: crear/editar/eliminar productos, precios, precios promocionales, imágenes, disponibilidad y estado de publicación.
- **Stock**: stock por producto, aviso de stock bajo y disponibilidad.
- **Promociones**: promociones con vigencia y producto asociado.
- **Reseñas**: moderación de opiniones; solo las aprobadas se publican en `/opiniones`.
- **Preguntas**: FAQ ordenable del sitio.
- **MIDES**: información verificada del beneficio MIDES (no inventar datos).
- **Configuración**: datos del negocio visibles en la web.
- **SEO**: títulos, descripciones y palabras clave.

## Pedidos

- El cliente agrega productos al pedido (guardado en `localStorage`).
- Completa nombre, dirección y localidad.
- Se abre WhatsApp (`wa.me/<número>`) con el mensaje del pedido preparado.
- **El pedido NO se confirma solo**: BrakMar Gas responde por WhatsApp para confirmar disponibilidad, precio final y entrega.

La única forma de venta confirmada es por WhatsApp: la web no recibe pagos.

## Base de datos

Archivo SQLite en `data/brakmar.db` (o `DATABASE_PATH`). Está ignorado por git; en producción usá un volumen persistente. Los precios se guardan como enteros en centavos de peso uruguayo.

Esquema principal: `products`, `categories`, `promotions`, `faqs`, `mides_info`, `reviews`, `settings`, `admin_users`, `rate_limits`.

## Comandos

```bash
npm run build   # build de producción
npm run lint    # eslint
npm run start   # servir la build de producción
```

## Despliegue (Vercel)

- Framework preset: **Next.js**.
- En **Functions** (ó Runtime settings) asegurate de usar Node.js ≥ 22.5.
- Completá las variables de entorno del panel de Vercel (nunca usés `.env.local` en la nube).
- El `node:sqlite` se ejecuta en la misma instancia que Vercel Functions; el archivo de base de datos/upload se mantiene solo durante la función. Para una fuente de datos persistente, configurá `DATABASE_PATH` apuntando a un Filesystem persistente, o consultá la documentación de almacenamiento de la plataforma que uses.
- `.env.example` documenta todas las variables.

## Seguridad

- Sesión: cookie `bg_session` firmada con HMAC + expiración de 12 h. La contraseña se guarda con hash `scrypt` (salt por usuario).
- `/admin` no se indexa (`robots.txt` y metadatos).
- Rate limiting en login y en envío de reseñas.
- Antispam en reseñas (honeypot + tiempo de envío mínimo + moderación previa a publicación).
- Subida de imágenes: solo PNG/JPG/WEBP/AVIF ≤ 3 MB, con validación de firma de archivo.
- Headers de seguridad globales (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

## Licencia

Uso interno del negocio. Sin datos inventados: precios, reseñas, promociones, redes y dirección se publican solo cuando el responsable los confirma.