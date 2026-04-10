# PulsoMD — Setup para activar el portal

## 1. Crear proyecto Supabase

1. Ve a [supabase.com](https://supabase.com) → New Project
2. Nombre: `pulsomd` | Region: us-east-1 (o la mas cercana a Mexico)
3. Una vez creado, ve a **Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Configurar la base de datos

1. En Supabase: **SQL Editor → New Query**
2. Pega el contenido de `supabase/schema.sql` y ejecuta
3. Verifica que se crearon las tablas: `clinics`, `users`, `invitations`, `questionnaire_responses`, `insights`

## 3. Configurar Supabase Auth

1. Authentication → **Providers** → Email → habilitar **Enable Email provider**
2. Authentication → **URL Configuration**:
   - Site URL: `http://localhost:3000` (dev)
   - Redirect URLs: agrega `http://localhost:3000/auth/callback`
3. Authentication → **Email Templates** → personalizar si quieres (opcional para MVP)

## 4. Crear cuenta admin

Despues de ejecutar el schema, crea el primer usuario admin manualmente:
```sql
-- En Supabase SQL Editor, despues de crear tu primer usuario via magic link:
UPDATE users SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
```

## 5. Configurar Resend (email)

1. Ve a [resend.com](https://resend.com) → crear cuenta gratis
2. API Keys → Create API Key
3. Copia el key → `RESEND_API_KEY`
4. Para MVP puedes usar el dominio de Resend (`onboarding@resend.dev`)
5. Para produccion: Domains → Add Domain → configura tu dominio

## 6. Actualizar .env.local

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
RESEND_API_KEY=re_xxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 7. Actualizar el remitente del email en /api/invite

En `src/app/api/invite/route.ts`, cambia:
```typescript
from: 'PulsoMD <pulsomd@medilud.com>',
```
por tu dominio verificado en Resend, o para pruebas:
```typescript
from: 'PulsoMD <onboarding@resend.dev>',
```

## 8. Correr localmente

```bash
cd /Users/javier/Documents/krush_media_agents/pulsomd
npm run dev
```

Abre http://localhost:3000

## 9. Flujo de prueba

1. Ve a `/login` → ingresa tu email de admin → click en el link del correo
2. Manualmente actualiza tu rol a 'admin' en Supabase SQL Editor
3. Ve a `/admin/invitar` → invita una clinica de prueba
4. Abre el link de invitacion → completa el flujo como doctor
5. Responde el cuestionario → verifica que aparecen insights en `/dashboard`
6. Ve a `/reporte` → descarga el PDF

## 10. Deploy en Vercel

```bash
npx vercel
```

- Agrega las variables de entorno en Vercel Dashboard
- Agrega la URL de Vercel en Supabase Auth → URL Configuration → Redirect URLs
- Actualiza `NEXT_PUBLIC_APP_URL` con la URL de Vercel

---

**Notas tecnicas:**
- Next.js 16 usa `proxy.ts` en lugar de `middleware.ts` para auth routing
- shadcn/ui v4 usa `@base-ui/react` internamente (API diferente a Radix)
- El motor de diagnostico es 100% rule-based — no usa AI ni Claude
- PDF se genera server-side con `@react-pdf/renderer` via `/api/pdf/[clinicId]`
