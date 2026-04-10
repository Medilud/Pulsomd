import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  clinic_name: z.string().min(1),
  doctor_name: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }

  const { email, clinic_name, doctor_name } = parsed.data
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await anonSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const token = crypto.randomUUID()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`

  const { error: inviteError } = await supabase
    .from('invitations')
    .insert([{
      email,
      clinic_name,
      doctor_name,
      token,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    }])

  if (inviteError) {
    console.error('Error creating invitation:', inviteError)
    return NextResponse.json({ error: 'Error al crear la invitacion' }, { status: 500 })
  }

  const emailResult = await sendInviteEmail({ doctor_name, clinic_name, inviteUrl, to: email })

  if (!emailResult.ok) {
    console.log(`[INVITE] URL manual para ${email}: ${inviteUrl}`)
    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      warning: 'La invitacion fue creada pero el email no se pudo enviar. Comparte el enlace manualmente.',
    })
  }

  return NextResponse.json({ success: true, token, inviteUrl })
}

// ─── Resend endpoint ──────────────────────────────────────────────────────────

const resendSchema = z.object({
  invitation_id: z.string().uuid(),
})

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const parsed = resendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invitation_id requerido' }, { status: 400 })
  }

  const { invitation_id } = parsed.data
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await anonSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || userData.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  // Look up original invitation
  const { data: original } = await supabase
    .from('invitations')
    .select('email, clinic_name, doctor_name')
    .eq('id', invitation_id)
    .single()

  if (!original) return NextResponse.json({ error: 'Invitacion no encontrada' }, { status: 404 })

  // Create a fresh token (new row)
  const newToken = crypto.randomUUID()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${newToken}`

  const { error: insertError } = await supabase
    .from('invitations')
    .insert([{
      email: original.email,
      clinic_name: original.clinic_name,
      doctor_name: original.doctor_name,
      token: newToken,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    }])

  if (insertError) {
    return NextResponse.json({ error: 'Error al regenerar la invitacion' }, { status: 500 })
  }

  const emailResult = await sendInviteEmail({
    doctor_name: original.doctor_name,
    clinic_name: original.clinic_name,
    inviteUrl,
    to: original.email,
  })

  if (!emailResult.ok) {
    return NextResponse.json({
      success: true,
      token: newToken,
      inviteUrl,
      warning: 'Nueva invitacion creada pero el email no se pudo enviar.',
    })
  }

  return NextResponse.json({ success: true, token: newToken, inviteUrl })
}

// ─── Shared email helper ──────────────────────────────────────────────────────

async function sendInviteEmail({
  doctor_name,
  clinic_name,
  inviteUrl,
  to,
}: {
  doctor_name: string
  clinic_name: string
  inviteUrl: string
  to: string
}): Promise<{ ok: boolean }> {
  if (!process.env.RESEND_API_KEY) return { ok: false }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'PulsoMD <pulsomd@medilud.com>',
      to: [to],
      subject: `${doctor_name}, te invitamos a conocer el pulso de tu clínica`,
      html: buildInviteEmail({ doctor_name, clinic_name, inviteUrl }),
    })
    if (error) {
      console.error('Resend error:', error)
      return { ok: false }
    }
    return { ok: true }
  } catch (e) {
    console.error('Email exception:', e)
    return { ok: false }
  }
}

function buildInviteEmail({
  doctor_name,
  clinic_name,
  inviteUrl,
}: {
  doctor_name: string
  clinic_name: string
  inviteUrl: string
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu diagnóstico gratuito de Medilud</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      margin: 0; padding: 0;
      background: #f7f5f0;
      color: #1a1a1a;
    }
    .wrapper { padding: 40px 16px; }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e8e4dc;
    }
    .header {
      background: #141414;
      padding: 28px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-brand { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header-by { color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
    .body { padding: 36px; }
    .greeting { font-size: 22px; font-weight: 700; color: #141414; margin: 0 0 16px; letter-spacing: -0.4px; }
    .lead { font-size: 15px; color: #555550; line-height: 1.65; margin: 0 0 28px; }
    .clinic-badge {
      display: inline-block;
      background: #faf7f0;
      border: 1px solid #e8dfc8;
      border-radius: 8px;
      padding: 10px 16px;
      margin: 0 0 28px;
      font-size: 14px;
      color: #8a6d00;
      font-weight: 600;
    }
    .items { margin: 0 0 28px; padding: 0; }
    .items li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #f0ede8;
      font-size: 14px;
      color: #444440;
      line-height: 1.5;
      list-style: none;
    }
    .items li:last-child { border-bottom: none; }
    .items li .dot {
      width: 6px; height: 6px;
      background: #c8a84b;
      border-radius: 50%;
      margin-top: 7px;
      flex-shrink: 0;
    }
    .cta-wrapper { text-align: center; margin: 32px 0 24px; }
    .cta {
      display: inline-block;
      background: #141414;
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .note {
      font-size: 12px;
      color: #999990;
      line-height: 1.6;
      text-align: center;
      margin: 0;
    }
    .footer {
      padding: 20px 36px;
      background: #f7f5f0;
      border-top: 1px solid #e8e4dc;
      text-align: center;
    }
    .footer p { color: #aaa9a0; font-size: 12px; margin: 0; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="header-brand">PulsoMD</span>
        <span class="header-by">por Medilud</span>
      </div>
      <div class="body">
        <p class="greeting">Dr./Dra. ${doctor_name},</p>
        <p class="lead">
          El equipo de <strong>Medilud</strong> te invita a descubrir el estado real de tu clínica y las oportunidades de crecimiento que aún no estás capturando.
        </p>
        <div class="clinic-badge">${clinic_name}</div>
        <ul class="items">
          <li><span class="dot"></span>Diagnóstico de las 6 áreas clave de tu clínica</li>
          <li><span class="dot"></span>Top 3 oportunidades con mayor impacto inmediato</li>
          <li><span class="dot"></span>Revenue estimado que tienes sin capturar cada mes</li>
          <li><span class="dot"></span>Reporte descargable con plan de acción personalizado</li>
        </ul>
        <p style="font-size:13px;color:#888;text-align:center;margin:0 0 16px;">Tiempo estimado: <strong>12-15 minutos</strong></p>
        <div class="cta-wrapper">
          <a href="${inviteUrl}" class="cta">Comenzar mi diagnóstico &rarr;</a>
        </div>
        <p class="note">
          Este enlace es personal y único para tu clínica.<br>
          Si tienes preguntas, contacta a tu asesor de Medilud.
        </p>
      </div>
      <div class="footer">
        <p>Equipo Medilud &middot; medilud.com.mx</p>
        <p style="margin-top:4px;font-size:11px;">
          ¿No esperabas este email? Ignora este mensaje.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`
}
