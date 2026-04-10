import Link from 'next/link'
import { DEMO_RESPONSES, DEMO_CLINIC, DEMO_INSIGHTS } from '@/lib/demo-data'
import { calculateScores } from '@/lib/scoring/engine'
import { calculateRevenueFugas, formatMXN } from '@/lib/revenue/calculator'
import { calculateSectionProgress, calculateOverallProgress, SECTIONS } from '@/lib/questions'
import InsightCard from '@/components/dashboard/InsightCard'
import ProgressRing from '@/components/dashboard/ProgressRing'
import SectionIcon from '@/components/ui/SectionIcon'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { FileText, ClipboardList } from 'lucide-react'

export default function DemoDashboardPage() {
  const scores = calculateScores(DEMO_RESPONSES)
  const fugas = calculateRevenueFugas(DEMO_RESPONSES)

  const highlightedInsights = DEMO_INSIGHTS.filter((i) => i.is_highlighted)
  const otherInsights = DEMO_INSIGHTS.filter((i) => !i.is_highlighted)
  const overallProgress = calculateOverallProgress(DEMO_RESPONSES)

  const scoreItems = [
    { label: 'Finanzas', value: scores.finanzas, weight: '30%' },
    { label: 'Journey del Paciente', value: scores.journey, weight: '25%' },
    { label: 'Operaciones', value: scores.operaciones, weight: '20%' },
    { label: 'Equipo', value: scores.equipo, weight: '15%' },
    { label: 'Tecnologia', value: scores.tecnologia, weight: '10%' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-base tracking-tight">PulsoMD</span>
            <span className="text-border">|</span>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {DEMO_CLINIC.name}
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/demo/cuestionario"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Cuestionario
            </Link>
            <Link
              href="/demo/reporte"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
            >
              <FileText className="w-3.5 h-3.5" />
              Reporte
            </Link>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
              DEMO
            </span>
          </nav>
        </div>
      </header>

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
                <p className="text-sm text-muted-foreground">
                  Tu clinica tiene{' '}
                  <span className="font-semibold text-foreground">
                    {formatMXN(fugas.totalEnRiesgo)}/mes
                  </span>{' '}
                  en revenue no capturado
                </p>
                <div className="pt-1">
                  <Link href="/demo/reporte">
                    <Button size="sm" className="h-8 px-4 text-xs font-medium">
                      Ver reporte completo
                    </Button>
                  </Link>
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
                const pct = calculateSectionProgress(section.id, DEMO_RESPONSES)
                return (
                  <Link
                    key={section.id}
                    href="/demo/cuestionario"
                    className="flex items-center gap-2.5 p-3 rounded-md hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                      <SectionIcon
                        name={section.icon}
                        className="w-3.5 h-3.5 text-muted-foreground"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">
                        {section.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Progress value={pct} className="h-1 flex-1" />
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 w-7 text-right">
                          {pct}%
                        </span>
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
            <CardTitle className="text-sm font-semibold tracking-tight">
              Scores por dimension
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3.5">
            {scoreItems.map((item) => {
              const barColor =
                item.value >= 70
                  ? '#166534'
                  : item.value >= 50
                  ? '#9a6200'
                  : '#9a3412'
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
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${item.value}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Wins */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base tracking-tight">Top Quick Wins</h2>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Alto impacto &middot; Bajo esfuerzo
            </span>
          </div>
          <div className="space-y-2.5">
            {highlightedInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} compact />
            ))}
          </div>
        </div>

        {/* Other insights */}
        {otherInsights.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h2 className="font-semibold text-base tracking-tight">Todas las recomendaciones</h2>
            <div className="space-y-2.5">
              {otherInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} compact />
              ))}
            </div>
          </div>
        )}

        {/* Footer spacing */}
        <div className="h-8" />
      </main>
    </div>
  )
}
