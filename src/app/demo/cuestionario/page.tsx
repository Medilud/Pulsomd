import Link from 'next/link'
import { DEMO_RESPONSES, DEMO_CLINIC } from '@/lib/demo-data'
import { SECTIONS, calculateSectionProgress, calculateOverallProgress } from '@/lib/questions'
import SectionIcon from '@/components/ui/SectionIcon'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ChevronRight, LayoutDashboard } from 'lucide-react'

export default function DemoCuestionarioPage() {
  const overallProgress = calculateOverallProgress(DEMO_RESPONSES)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-base tracking-tight">PulsoMD</span>
          <div className="flex items-center gap-4">
            <Link
              href="/demo/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
              DEMO
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-7">
        {/* Back + Title */}
        <div className="space-y-1.5">
          <Link
            href="/demo/dashboard"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Diagno&#769;stico de tu cli&#769;nica</h1>
          <p className="text-sm text-muted-foreground">
            Completa las 6 secciones para recibir tu diagnostico personalizado.
          </p>
        </div>

        {/* Progress general */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Progreso total</span>
            <span className="font-semibold tabular-nums">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
        </div>

        {/* Sections list */}
        <div className="space-y-2">
          {SECTIONS.map((section, index) => {
            const sectionProgress = calculateSectionProgress(section.id, DEMO_RESPONSES)
            const isComplete = sectionProgress === 100
            const isStarted = sectionProgress > 0 && !isComplete

            return (
              <Link key={section.id} href={`/demo/cuestionario/${section.id}`}>
                <Card className="border border-border/60 shadow-none hover:border-border transition-all hover:shadow-sm cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isComplete
                            ? 'bg-emerald-50'
                            : 'bg-muted group-hover:bg-muted/70'
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <SectionIcon
                            name={section.icon}
                            className="w-4 h-4 text-muted-foreground"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Sección {index + 1}
                          </span>
                          {isComplete && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                              Completada
                            </span>
                          )}
                          {isStarted && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                              En progreso
                            </span>
                          )}
                          {!isStarted && !isComplete && (
                            <span className="text-[10px] font-semibold text-muted-foreground border border-border rounded-full px-2 py-0.5">
                              Pendiente
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{section.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {section.description}
                        </p>
                        {isStarted && (
                          <div className="mt-2">
                            <Progress value={sectionProgress} className="h-1" />
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link href="/demo/reporte">
            <Button size="lg" className="w-full sm:w-auto h-10 px-6 text-sm font-medium">
              Ver mi diagno&#769;stico completo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
