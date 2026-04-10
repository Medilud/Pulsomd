import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createPDFDocument } from '@/lib/pdf/generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const { clinicId } = await params
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

  // Verify auth via anon client
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has access to this clinic
  const { data: userData } = await anonSupabase
    .from('users')
    .select('role, clinic_id')
    .eq('id', user.id)
    .single()

  const hasAccess =
    userData?.role === 'admin' || userData?.clinic_id === clinicId

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch clinic data
  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single()

  if (!clinic) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
  }

  // Fetch responses
  const { data: responsesData } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('clinic_id', clinicId)

  const responseMap: Record<string, string> = {}
  responsesData?.forEach((r) => { responseMap[r.question_key] = r.answer || '' })

  // Fetch insights
  const { data: insightsData } = await supabase
    .from('insights')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('priority_score', { ascending: false })

  // Generate PDF
  const pdfDoc = createPDFDocument({
    clinic,
    responses: responseMap,
    insights: (insightsData || []).map((i) => ({
      ...i,
      action_steps: typeof i.action_steps === 'string'
        ? JSON.parse(i.action_steps)
        : i.action_steps || [],
    })),
  })

  const pdfBuffer = await renderToBuffer(pdfDoc)

  const clinicSlug = clinic.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const filename = `pulsomd-${clinicSlug}-reporte.pdf`

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
