import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { calculateScores } from '@/lib/scoring/engine'
import { calculateRevenueFugas, formatMXN } from '@/lib/revenue/calculator'
import { calculateSectionProgress, calculateOverallProgress, SECTIONS } from '@/lib/questions'
import AppHeader from '@/components/layout/AppHeader'
import InsightCard from '@/components/dashboard/InsightCard'
import ProgressRing from '@/components/dashboard/ProgressRing'
import SectionIcon from '@/components/ui/SectionIcon'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ClipboardList } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('clinic_id, clinics(name, doctor_name, patients_per_month)')
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

  const overallProgress = calculateOverallProgress(responseMap)
  const scores = calculateScores(responseMap)
  const fugas = calculateRevenueFugas(responseMap)

  const clinic = (userData as { clinics?: { name?: string; doctor_name?: string } }).clinics
  const clinicName = clinic?.name || 'Tu clinica'

  const highlightedInsights = insightsData?.filter((i) => i.is_highlighted) || []
  const otherInsights = insightsData?.filter((i) => !i.is_highlighted) || []

  const scoreItems = [
    { label: 'Finanzas', value: scores.finanzas, weight: '30%' },
    { label: 'Journey del Paciente', value: scores.journey, weight: '25%' },
    { label: 'Operaciones', value: scores.operaciones, weight: '20%' },
    { label: 'Equipo', value: scores.equipo, weight: '15%' },
    { label: 'Tecnologia', value: scores.tecnologia, weight: '10%' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader clinicName={clinicName} />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Health Score Hero */}
        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-7">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ProgressRing progress={scores.global} size={136} label="Health Score" />
              <div className="flex-1 text-center sm:text-left space-y-3">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Business Health Score
                </p>
                <p className="text-3xl font-bold tracking-tight" style={{ color: scores.color }}>
                  {scores.label}
                </p>
                {fugas.hasData && fugas.totalEnRiesgo > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tu clinica tiene{' '}
                    <span className="font-semibold text-foreground">
                      {formatMXN(fugas.totalEnRiesgo)}/mes
                    </span>{' '}
                    en revenue no capturado
                  </p>
                )}
                <div className="pt-1">
                  {overallProgress < 100 ? (
                    <Link href="/cuestionario">
                      <Button size="sm" variant="outline" className="h-8 px-4 text-xs font-medium">
                        Completar diagno&#769;stico ({overallProgress}%)
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/reporte">
                      <Button size="sm" className="h-8 px-4 text-xs font-medium">
                        Ver reporte completo
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress cuestionario */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-6 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Progreso del diagno&#769;stico
              </CardTitle>
              <span className="text-sm font-medium text-muted-foreground">{overallProgress}%</span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-4">
            <Progress value={overallProgress} className="h-1.5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SECTIONS.map((section) => {
                const pct = calculateSectionProgress(section.id, responseMap)
                return (
                  <Link
                    key={section.id}
                    href={`/cuestionario/${section.id}`}
                    className="flex items-center gap-2.5 p-3 rounded-md hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                      <SectionIcon name={section.icon} className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{section.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Progress value={pct} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scores por dimension */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3 px-6 pt-5">
            <CardTitle className="text-sm font-semibold tracking-tight">Scores por dimensio&#769;n</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3.5">
            {scoreItems.map((item) => {
              const barColor = item.value >= 70 ? '#166534' : item.value >= 50 ? '#9a6200' : '#9a3412'
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.label}
                      <span className="ml-1 text-muted-foreground/60">({item.weight})</span>
                    </span>
                    <span className="font-medium tabular-nums">{item.value}/100</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Wins */}
        {highlightedInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base tracking-tight">Top Quick Wins</h2>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Alto impacto &middot; Bajo esfuerzo
              </span>
            </div>
            <div className="space-y-2.5">
              {highlightedInsights.map((insight) => (
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

        {/* Other insights */}
        {otherInsights.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h2 className="font-semibold text-base tracking-tight">Todas las recomendaciones</h2>
            <div className="space-y-2.5">
              {otherInsights.map((insight) => (
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

        {/* Empty state */}
        {(insightsData?.length ?? 0) === 0 && overallProgress < 30 && (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <ClipboardList className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold tracking-tight">Tus insights apareceran aqui</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Completa al menos una seccion del cuestionario para ver tus primeras recomendaciones.
              </p>
              <Link href="/cuestionario">
                <Button size="sm" className="mt-2 h-8 px-4 text-xs">Comenzar cuestionario</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="h-6" />
      </main>
    </div>
  )
}
