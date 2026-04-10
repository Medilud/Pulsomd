# PulsoMD — Guía de Transferencia a Medilud

> Preparado por Krush Media
> Última actualización: Abril 2025

---

## Qué es PulsoMD

PulsoMD es un portal de diagnóstico empresarial para clínicas estéticas. Medilud lo usa para:

1. **Invitar doctores** via email (link único por clínica)
2. **El doctor completa un cuestionario** de ~15 min sobre 6 áreas de su negocio
3. **El sistema genera automáticamente** un Health Score, insights priorizados y revenue en riesgo
4. **Se descarga un reporte PDF** listo para entregar o usar en reuniones de consultoría

---

## Estado del Producto

### Completamente construido y funcionando

| Módulo | Ruta | Estado |
|--------|------|--------|
| Demo sin login | `/demo` | ✅ Listo |
| Login (magic link) | `/login` | ✅ Listo |
| Aceptar invitación | `/invite/[token]` | ✅ Listo |
| Onboarding clínica | `/onboarding` | ✅ Listo |
| Cuestionario (6 secciones) | `/cuestionario` | ✅ Listo |
| Dashboard del doctor | `/dashboard` | ✅ Listo |
| Reporte completo | `/reporte` | ✅ Listo |
| Descarga PDF | `/api/pdf/[id]` | ✅ Listo |
| Panel admin — Clínicas | `/admin/clinicas` | ✅ Listo |
| Panel admin — Detalle | `/admin/clinica/[id]` | ✅ Listo |
| Panel admin — Invitaciones | `/admin/invitaciones` | ✅ Listo |
| Panel admin — Invitar | `/admin/invitar` | ✅ Listo |

### Bloqueado hasta completar setup de Medilud

| Función | Bloqueado por |
|---------|--------------|
| Envío de emails de invitación | Dominio de Resend sin verificar |
| Login real de doctores | Mismo — el magic link no llega |
| Acceso al panel admin | Requiere crear usuario admin en Supabase |

> **Workaround activo:** En `/admin/invitar`, si el email falla, el sistema muestra el link de invitación para compartirlo manualmente por WhatsApp o email. Esto funciona hoy.

---

## Lo que Medilud necesita proveer

### 1. Cuenta Resend (Email)

**Por qué:** PulsoMD envía emails via Resend (magic links de login + invitaciones).

**Pasos:**
1. Crear cuenta en [resend.com](https://resend.com)
2. Ir a **Domains → Add Domain**
3. Agregar `medilud.com.mx` (o el dominio que usen)
4. Agregar los registros DNS que Resend proporciona (típicamente 3 registros TXT/MX)
5. Esperar verificación (puede tardar hasta 24h, usualmente minutos)
6. Ir a **API Keys → Create API Key** con permiso "Sending access"
7. Copiar el API key (formato `re_xxxx`)

**Configurar en Supabase:**
- Dashboard → Project → Auth → SMTP Settings
- Activa "Custom SMTP"
- Host: `smtp.resend.com`
- Port: `465`
- User: `resend`
- Password: el API key de Resend
- Sender name: `PulsoMD`
- Sender email: `pulsomd@medilud.com.mx`

**Configurar en `.env.local` (producción):**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

### 2. Proyecto Supabase (Producción)

**Por qué:** Actualmente el proyecto de desarrollo está en la cuenta de Krush Media. Para producción, Medilud necesita su propio proyecto.

**Pasos:**
1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto — nombre sugerido: `pulsomd-prod`
3. Elegir región más cercana: `South America (São Paulo)` o `US East (N. Virginia)`
4. Anotar la contraseña del proyecto (se necesita una sola vez)
5. Ir a **Settings → API**
6. Copiar:
   - **Project URL** (formato `https://xxxxxxxx.supabase.co`)
   - **anon/public key** (Legacy — formato `eyJ...`)
   - **service_role key** (Legacy — formato `eyJ...`)

> ⚠️ Usar las llaves del tab **"Legacy anon, service_role API keys"** — las nuevas llaves `sb_publishable_` no son compatibles con la versión actual del SDK.

7. Ir a **SQL Editor** y ejecutar el contenido completo de `supabase/schema.sql`
8. Ir a **Auth → Settings**:
   - Desactivar "Enable email confirmations"
   - Activar "Enable sign in with email OTP"
   - Configurar Redirect URL: `https://[tu-dominio]/auth/callback`

---

### 3. Hosting (Vercel recomendado)

**Pasos:**
1. Crear cuenta en [vercel.com](https://vercel.com)
2. Importar el repositorio de GitHub (Krush Media transferirá el repo)
3. Framework: Next.js (detectado automáticamente)
4. Agregar variables de entorno (ver sección abajo)
5. Deploy

---

### 4. Dominio

**Sugerencia:** `app.medilud.com.mx` o `pulsomd.medilud.com.mx`

Configurar en Vercel → Project → Domains → Add domain.

---

## Variables de Entorno (Producción)

Copiar estas variables en Vercel → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL (dominio de producción)
NEXT_PUBLIC_APP_URL=https://app.medilud.com.mx

# Resend (emails)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=PulsoMD <pulsomd@medilud.com>
```

---

## Crear el Primer Usuario Admin

Una vez desplegado en producción, hay que crear el usuario de Medilud que administrará el panel.

### Paso 1 — Crear el usuario en Supabase Auth

En Supabase Dashboard → Authentication → Users → Invite user (o Add user):
- Email: el email del admin de Medilud
- Opcionalmente, set password

### Paso 2 — Asignarle rol `admin`

Ir a **SQL Editor** y ejecutar:

```sql
-- Reemplaza el email con el del admin real
UPDATE public.users
SET role = 'admin'
WHERE email = 'ia@medilud.com';
```

> Si el usuario no aparece aún en la tabla `users`, espera que complete el primer login — el trigger lo crea automáticamente.

### Alternativa: insertar directamente

```sql
-- Solo si el usuario ya existe en auth.users
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, 'Admin Medilud', 'admin'
FROM auth.users
WHERE email = 'ia@medilud.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## Flujo Completo de Uso

```
Admin Medilud
    │
    ├─→ /admin/invitar → llena datos del doctor → se crea invitación
    │       │
    │       └─→ Email automático al doctor (si Resend está configurado)
    │           ó
    │           Copy link manual → WhatsApp/email
    │
Doctor recibe link /invite/[token]
    │
    ├─→ Confirma nombre y email
    ├─→ Recibe magic link en su correo
    ├─→ Click → /auth/callback → /onboarding
    │
Onboarding (datos de la clínica)
    │
    └─→ /cuestionario → 6 secciones con auto-save
            │
            └─→ Al completar → /reporte
                    │
                    ├─→ Health Score
                    ├─→ Revenue en riesgo
                    ├─→ Insights priorizados
                    └─→ Descarga PDF
```

---

## Arquitectura Técnica

```
pulsomd/
├── src/app/
│   ├── (auth)          login, invite, onboarding
│   ├── cuestionario/   6 secciones con auto-save a Supabase
│   ├── dashboard/      vista principal del doctor
│   ├── reporte/        diagnóstico completo
│   ├── admin/          panel Medilud (clínicas, invitaciones)
│   ├── demo/           demo sin login (para prospectos)
│   └── api/            invite, insights, pdf
├── src/lib/
│   ├── questions/      definición de las 6 secciones y preguntas
│   ├── scoring/        motor de cálculo del Health Score
│   ├── revenue/        cálculo de revenue en riesgo
│   ├── insights/       generador de recomendaciones
│   └── pdf/            generador de PDF (@react-pdf/renderer)
└── supabase/
    └── schema.sql      esquema completo de BD
```

**Stack:**
- Next.js 16.2 (App Router)
- Supabase (Auth + PostgreSQL)
- Tailwind CSS v4 + shadcn/ui
- Resend (email)
- @react-pdf/renderer (PDF)
- Vercel (hosting recomendado)

---

## Proceso de Transferencia

### Cuando Medilud esté listo para producción:

1. **Medilud crea** sus cuentas (Supabase, Resend, Vercel)
2. **Krush Media transfiere** el repositorio de GitHub a la cuenta de Medilud
3. **Medilud configura** las variables de entorno en Vercel
4. **Medilud ejecuta** el schema SQL en su proyecto Supabase
5. **Medilud configura** el SMTP de Resend en Supabase Auth
6. **Medilud crea** su primer usuario admin (pasos arriba)
7. **Krush Media revoca** acceso al proyecto de desarrollo
8. **El dominio de producción** apunta a Vercel

### Durante el desarrollo (hasta el transfer):

- El proyecto de desarrollo está en Supabase de Krush Media
- URL de desarrollo: `http://localhost:3000`
- Las invitaciones se copian manualmente (email no funciona hasta que Resend tenga dominio verificado)

---

## Notas Importantes

### Email sin dominio verificado
Mientras Resend no tenga el dominio de Medilud verificado, los emails no se enviarán. El sistema está diseñado para esto: siempre muestra el link de invitación en el panel admin. Los doctores pueden recibir su link por WhatsApp directamente del asesor.

### Magic link y expiración
Los magic links de Supabase expiran en 1 hora por defecto. Si un doctor no abre su link a tiempo, el admin puede reenviarle desde `/admin/invitaciones` → botón "Reenviar".

### Demo público
La ruta `/demo` es completamente pública — no requiere login. Puede usarse en presentaciones a prospectos. Muestra datos ficticios realistas de "Clínica Estética Dr. Vargas".

### Datos de la clínica dev
El proyecto de desarrollo tiene datos ficticios. No hay información real de clínicas en la base de datos de desarrollo.

---

## Contacto

**Krush Media** — Para dudas técnicas durante la transferencia
Javier — [contacto de Krush Media]
