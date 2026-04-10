import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { calculateScores } from '@/lib/scoring/engine'
import { calculateRevenueFugas, formatMXN } from '@/lib/revenue/calculator'
import AppHeader from '@/components/layout/AppHeader'
import InsightCard from '@/components/dashboard/InsightCard'
import ProgressRing from '@/components/dashboard/ProgressRing'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const BENCHMARKS = [
  { metric: 'Tasa de cancelacion promedio del sector', value: '12–15%' },
  { metric: 'Tasa de retorno saludable', value: '55–65%' },
  { metric: 'Ticket promedio medicina estetica MX', value: '$5,000 – $12,000 MXN' },
  { metric: 'Pacientes/mes clinica establecida', value: '60–120' },
  { metric: 'Margen bruto tratamientos esteticos', value: '60–75%' },
  { metric: '% de revenue proveniente de pacientes recurrentes', value: '65–70%' },
  { metric: 'Canales de adquisicion activos recomendados', value: 'Minimo 3' },
]

export default async function ReportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('clinic_id, clinics(name, doctor_name, specialty, city, patients_per_month, years_operating)')
    .eq('id', user.id)
    .single()

  if (!userData?.clinic_id) redirect('/onboarding')

  const { data: responsesData } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('clinic_id', userData.clinic_id)

  const responseMap: Record<string, string> = {}
  responsesData?.forEach((r) => { responseMap[r.question_key] = r.answer || '' })

  const { data: insightsData } = await supabase
    .from('insights')
    .select('*')
    .eq('clinic_id', userData.clinic_id)
    .order('priority_score', { ascending: false })

  const scores = calculateScores(responseMap)
  const fugas = calculateRevenueFugas(responseMap)

  const clinic = (userData as {
    clinics?: { name?: string; doctor_name?: string; specialty?: string; city?: string }
  }).clinics
  const clinicName = clinic?.name || 'Tu clinica'

  const level2 = insightsData?.filter((i) => i.urgency_level === 2) || []
  const level3 = insightsData?.filter((i) => i.urgency_level === 3) || []
  const highlighted = insightsData?.filter((i) => i.is_highlighted) || []

  const scoreItems = [
    { label: 'Finanzas', value: scores.finanzas },
    { label: 'Journey del Paciente', value: scores.journey },
    { label: 'Operaciones', value: scores.operaciones },
    { label: 'Equipo', value: scores.equipo },
    { label: 'Tecnologia', value: scores.tecnologia },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader clinicName={clinicName} />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Report header */}
        <div className="space-y-2 border-b border-border/60 pb-7">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Reporte de Diagn\u00f3stico &mdash; PulsoMD
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{clinicName}</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              {clinic?.city && ` · ${clinic.city}`}
              {clinic?.specialty && ` · ${clinic.specialty}`}
            </p>
            <a href={`/api/pdf/${userData.clinic_id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Descargar PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Revenue headline */}
        {fugas.hasData && fugas.totalEnRiesgo > 0 && (
          <Card className="border border-[var(--gold-light)] shadow-none" style={{ background: 'var(--gold-muted)' }}>
            <CardContent className="p-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--gold)' }}>
                Revenue no capturado (estimado)
              </p>
              <p className="text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--gold)' }}>
                {formatMXN(fugas.totalEnRiesgo)}/mes
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: 'Cancelaciones', value: fugas.fugaCancelaciones },
                  { label: 'Upsell no realizado', value: fugas.fugaUpsell },
                  { label: 'Pacientes sin reactivar', value: fugas.retornoPotencial },
                  { label: 'Referidos no capturados', value: fugas.oportunidadReferidos },
                ].filter(i => i.value > 0).map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-foreground/70">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{formatMXN(item.value)}/mes</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Score + Scores */}
        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-7">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ProgressRing progress={scores.global} size={148} label="Health Score" />
              <div className="flex-1 w-full space-y-3">
                <p className="text-2xl font-bold tracking-tight text-center sm:text-left" style={{ color: scores.color }}>
                  {scores.label}
                </p>
                <div className="space-y-2.5">
                  {scoreItems.map((item) => {
                    const barColor = item.value >= 70 ? '#166534' : item.value >= 50 ? '#9a6200' : '#9a3412'
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-36 flex-shrink-0">{item.label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-7 text-right">{item.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Quick Wins */}
        {highlighted.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-tight">Top 3 Quick Wins</h2>
                <span className="text-[10px] font-semibold tracking-widest text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5">
                  Prioridad m\u00e1xima
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Implementa estas acciones esta semana para capturar el mayor impacto.
              </p>
            </div>
            <div className="space-y-2.5">
              {highlighted.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={{ ...insight, action_steps: typeof insight.action_steps === 'string' ? JSON.parse(insight.action_steps) : insight.action_steps || [] }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Level 2 */}
        {level2.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Nivel 2 &mdash; Optimizaci\u00f3n</h2>
              <p className="text-sm text-muted-foreground">Implementar en los siguientes 30 a 90 dias.</p>
            </div>
            <div className="space-y-2.5">
              {level2.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={{ ...insight, action_steps: typeof insight.action_steps === 'string' ? JSON.parse(insight.action_steps) : insight.action_steps || [] }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Level 3 */}
        {level3.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Nivel 3 &mdash; Escalamiento</h2>
              <p className="text-sm text-muted-foreground">Infraestructura para el crecimiento a largo plazo (90+ dias).</p>
            </div>
            <div className="space-y-2.5">
              {level3.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={{ ...insight, action_steps: typeof insight.action_steps === 'string' ? JSON.parse(insight.action_steps) : insight.action_steps || [] }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Benchmarks */}
        <div className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight">Benchmarks del Sector</h2>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              &ldquo;Estos numeros son el resultado de analizar clinicas esteticas exitosas en Mexico.
              No son el techo — son el piso desde donde se construye el crecimiento.&rdquo;
            </p>
          </div>
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {BENCHMARKS.map((b, i) => (
                  <div
                    key={b.metric}
                    className={`flex justify-between items-center px-5 py-3.5 ${i === 0 ? 'rounded-t-lg' : ''} ${i === BENCHMARKS.length - 1 ? 'rounded-b-lg' : ''}`}
                  >
                    <span className="text-sm text-muted-foreground">{b.metric}</span>
                    <span className="text-sm font-semibold tabular-nums">{b.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Medilud */}
        <Card className="border border-border/60 shadow-none overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-foreground text-background p-8 text-center space-y-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase opacity-60">Siguiente paso</p>
              <p className="text-xl font-bold tracking-tight">Este diagn\u00f3stico es el punto de partida.</p>
              <p className="text-sm opacity-70 max-w-md mx-auto leading-relaxed">
                El equipo de Medilud esta listo para ayudarte a ejecutar cada una de estas recomendaciones con un plan de accion personalizado.
              </p>
              <div className="pt-2 space-y-1">
                <p className="text-sm font-semibold">Contacta a tu asesor de Medilud</p>
                <p className="text-xs opacity-50">medilud.com.mx</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-6" />
      </main>
    </div>
  )
}
