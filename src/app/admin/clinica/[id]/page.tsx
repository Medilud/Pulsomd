import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/layout/AppHeader'
import InsightCard from '@/components/dashboard/InsightCard'
import SectionIcon from '@/components/ui/SectionIcon'
import { calculateScores } from '@/lib/scoring/engine'
import { calculateRevenueFugas, formatMXN } from '@/lib/revenue/calculator'
import { SECTIONS } from '@/lib/questions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download } from 'lucide-react'

export default async function AdminClinicaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', id)
    .single()

  if (!clinic) notFound()

  const { data: responsesData } = await supabase
    .from('questionnaire_responses')
    .select('question_key, section, answer, answered_at')
    .eq('clinic_id', id)
    .order('answered_at', { ascending: true })

  const responseMap: Record<string, string> = {}
  responsesData?.forEach((r) => { responseMap[r.question_key] = r.answer || '' })

  const { data: insightsData } = await supabase
    .from('insights')
    .select('*')
    .eq('clinic_id', id)
    .order('priority_score', { ascending: false })

  const scores = calculateScores(responseMap)
  const fugas = calculateRevenueFugas(responseMap)

  const totalAnswered = responsesData?.length || 0
  const TOTAL_REQUIRED = 31
  const progress = Math.min(100, Math.round((totalAnswered / TOTAL_REQUIRED) * 100))

  const statCards = [
    { label: 'Health Score', value: scores.global, color: scores.color },
    { label: 'Completado', value: `${progress}%` },
    { label: 'Insights generados', value: insightsData?.length || 0 },
    { label: 'Revenue en riesgo', value: fugas.hasData ? formatMXN(fugas.totalEnRiesgo) : '—', amber: fugas.hasData && fugas.totalEnRiesgo > 0 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isAdmin />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Back */}
        <Link
          href="/admin/clinicas"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Cl&#237;nicas
        </Link>

        {/* Clinic header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/60 pb-7">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Detalle de cl&#237;nica
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{clinic.name}</h1>
            <p className="text-sm text-muted-foreground">
              {clinic.doctor_name}
              {clinic.specialty && <span> &middot; {clinic.specialty}</span>}
              {clinic.city && <span> &middot; {clinic.city}</span>}
            </p>
          </div>
          <a href={`/api/pdf/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Descargar PDF
            </Button>
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="border border-border/60 rounded-xl p-5 bg-card shadow-none text-center">
              <p
                className="text-2xl font-bold tracking-tight tabular-nums"
                style={s.color ? { color: s.color } : s.amber ? { color: '#9a6200' } : undefined}
              >
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue breakdown */}
        {fugas.hasData && fugas.totalEnRiesgo > 0 && (
          <Card className="border border-[var(--gold-light)] shadow-none" style={{ background: 'var(--gold-muted)' }}>
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--gold)' }}>
                Revenue no capturado (estimado)
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: 'Cancelaciones', value: fugas.fugaCancelaciones },
                  { label: 'Upsell no realizado', value: fugas.fugaUpsell },
                  { label: 'Pacientes sin reactivar', value: fugas.retornoPotencial },
                  { label: 'Referidos no capturados', value: fugas.oportunidadReferidos },
                ].filter(i => i.value > 0).map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-foreground/60">{item.label}</p>
                    <p className="text-sm font-semibold">{formatMXN(item.value)}/mes</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questionnaire responses */}
        <div className="space-y-4">
          <h2 className="text-base font-bold tracking-tight">Respuestas del cuestionario</h2>
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {SECTIONS.map((section) => {
                  const sectionResponses = responsesData?.filter(
                    (r) => section.questions.some((q) => q.key === r.question_key)
                  ) || []

                  return (
                    <div key={section.id} className="px-6 py-4">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${sectionResponses.length === 0 ? 'bg-muted' : 'bg-emerald-50'}`}>
                          <SectionIcon
                            name={section.icon}
                            className={`w-3.5 h-3.5 ${sectionResponses.length === 0 ? 'text-muted-foreground/40' : 'text-emerald-700'}`}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${sectionResponses.length === 0 ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                          {section.title}
                        </span>
                        {sectionResponses.length === 0 && (
                          <span className="text-[10px] text-muted-foreground/50 border border-border/40 rounded-full px-2 py-0.5">
                            Sin respuestas
                          </span>
                        )}
                      </div>
                      {sectionResponses.length > 0 && (
                        <div className="ml-9 space-y-1.5">
                          {section.questions.map((q) => {
                            const resp = responseMap[q.key]
                            if (!resp) return null
                            return (
                              <div key={q.key} className="flex gap-3 text-xs">
                                <span className="text-muted-foreground flex-shrink-0 w-52 truncate">{q.label}</span>
                                <span className="font-medium">{resp}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {insightsData && insightsData.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h2 className="text-base font-bold tracking-tight">Insights generados</h2>
            <div className="space-y-2.5">
              {insightsData.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={{
                    ...insight,
                    action_steps: typeof insight.action_steps === 'string'
                      ? JSON.parse(insight.action_steps)
                      : insight.action_steps || [],
                  }}
                  compact
                />
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
      </main>
    </div>
  )
}
