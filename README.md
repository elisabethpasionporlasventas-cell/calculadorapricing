# Plano de Escandallo — Arquitectura Comercial

App de escandallo lista para desplegar gratis en Vercel.

## 1. Subir a GitHub

1. Crea un repositorio nuevo (vacío) en https://github.com/new — por ejemplo `escandallo-arquitectura-comercial`.
2. En tu ordenador, dentro de esta carpeta:
   ```
   git init
   git add .
   git commit -m "Primera versión"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/escandallo-arquitectura-comercial.git
   git push -u origin main
   ```

## 2. Desplegar en Vercel (gratis)

1. Ve a https://vercel.com y entra con tu cuenta de GitHub.
2. "Add New… → Project" y selecciona el repositorio que acabas de subir.
3. Vercel detecta automáticamente que es un proyecto Vite — no toques nada, pulsa "Deploy".
4. En 1-2 minutos tendrás una URL tipo `escandallo-arquitectura-comercial.vercel.app`. Puedes conectarle tu propio dominio o subdominio (p. ej. `escandallo.tuweb.com`) desde Project → Settings → Domains.

## 3. Activar la sugerencia de margen con IA (opcional, tiene un coste mínimo de uso)

Esta función NO es gratuita al 100% porque hace llamadas a la API de Anthropic (Claude) — el coste real es de céntimos por sugerencia, se paga solo por uso, sin cuota fija.

1. Consigue una clave en https://console.anthropic.com (API Keys).
2. En Vercel: Project → Settings → Environment Variables → añade `ANTHROPIC_API_KEY` con tu clave.
3. Vuelve a desplegar (Vercel → Deployments → "Redeploy").

Si no configuras la clave, el resto de la app funciona igual — solo el botón de sugerencia de IA mostrará un aviso.

## 4. Conectar el pago (Stripe Payment Link)

1. Crea el Payment Link en https://dashboard.stripe.com/payment-links por 19€ IVA incluido, activando los campos de nombre y email.
2. En "Después del pago", configura la redirección a tu URL de Vercel (la página de la herramienta).
3. Enlaza ese Payment Link desde tu landing (Carrd o la que uses).

## Desarrollo local

```
npm install
npm run dev
```
