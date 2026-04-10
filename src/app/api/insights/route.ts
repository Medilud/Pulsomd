import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generateInsights } from '@/lib/insights/generator'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { clinicId } = body

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId required' }, { status: 400 })
  }

  // Fetch all questionnaire responses
  const { data: responsesData } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('clinic_id', clinicId)

  const responseMap: Record<string, string> = {}
  responsesData?.forEach((r) => { responseMap[r.question_key] = r.answer || '' })

  // Generate insights
  const insights = generateInsights(responseMap)

  // Upsert insights (delete old ones first, then insert fresh)
  await supabase
    .from('insights')
    .delete()
    .eq('clinic_id', clinicId)

  if (insights.length > 0) {
    const insightsToInsert = insights.map((insight) => ({
      clinic_id: clinicId,
      category: insight.category,
      title: insight.title,
      description: insight.description,
      action_steps: JSON.stringify(insight.action_steps),
      timeline: insight.timeline,
      responsible: insight.responsible,
      impact: insight.impact,
      effort: insight.effort,
      urgency_level: insight.urgency_level,
      revenue_mxn: insight.revenue_mxn,
      priority_score: insight.priority_score,
      is_highlighted: insight.is_highlighted,
      generated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('insights')
      .insert(insightsToInsert)

    if (error) {
      console.error('Error inserting insights:', error)
      return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, count: insights.length })
}
