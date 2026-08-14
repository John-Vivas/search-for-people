# Estamos Buscando

Plataforma comunitaria para localizar **personas desaparecidas, encontradas, sin identificar (NN) y mascotas** durante emergencias, con mapa georreferenciado.

🔗 **En producción:** [www.alertavivo.co](https://www.alertavivo.co)

> ⚠️ Iniciativa **independiente y comunitaria**. No representa a ninguna autoridad oficial. En una emergencia, seguí siempre la línea **123**.

---

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # completá tus credenciales
npm run dev                  # http://localhost:3000
```

Sin las variables de Supabase, arranca en **modo mock** (datos ficticios). Con ellas, usa datos reales.

### Variables (`.env.local`)

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_preset_unsigned

VITE_ENABLE_AID=false   # tablero de "Ayuda" (en desarrollo)
```

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Sirve el build |
| `npm run lint` | Chequeo de tipos |

## Stack

React 19 · Vite · TypeScript · Tailwind v4 · Supabase · Cloudinary · Leaflet · Vercel.

## Base de datos

Las migraciones están en `supabase/migrations/` y se aplican en orden (SQL Editor de Supabase o `npx supabase db push`).
