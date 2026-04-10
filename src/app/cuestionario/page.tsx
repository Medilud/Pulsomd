import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SECTIONS, calculateSectionProgress, calculateOverallProgress } from '@/lib/questions'
import SectionIcon from '@/components/ui/SectionIcon'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ChevronRight } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'

export default async function CuestionarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('clinic_id, clinics(name)')
    .eq('id', user.id)
    .single()

  if (!userData?.clinic_id) redirect('/onboarding')

  const { data: responses } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('clinic_id', userData.clinic_id)

  const responseMap: Record<string, string> = {}
  responses?.forEach((r) => { responseMap[r.question_key] = r.answer || '' })

  const overallProgress = calculateOverallProgress(responseMap)
  const clinic = (userData as { clinics?: { name?: string } }).clinics
  const clinicName = clinic?.name || 'Tu clinica'

  return (
    <div className="min-h-screen bg-background">
      <AppHeader clinicName={clinicName} />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-7">
        {/* Header */}
        <div className="space-y-1.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Diagn\u00f3stico de tu cl\u00ednica</h1>
          <p className="text-sm text-muted-foreground">
            Completa las 6 secciones para recibir tu diagn\u00f3stico personalizado.
          </p>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Progreso total</span>
            <span className="font-semibold tabular-nums">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
        </div>

        {/* Sections */}
        <div className="space-y-2">
          {SECTIONS.map((section, index) => {
            const sectionProgress = calculateSectionProgress(section.id, responseMap)
            const isComplete = sectionProgress === 100
            const isStarted = sectionProgress > 0 && !isComplete

            return (
              <Link key={section.id} href={`/cuestionario/${section.id}`}>
                <Card className="border border-border/60 shadow-none hover:border-border hover:shadow-sm transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isComplete ? 'bg-emerald-50' : 'bg-muted group-hover:bg-muted/70'}`}>
                        {isComplete ? (
                          <Check className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <SectionIcon name={section.icon} className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
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
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.description}</p>
                        {isStarted && (
                          <div className="mt-2">
                            <Progress value={sectionProgress} className="h-1" />
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {overallProgress === 100 && (
          <div className="pt-2">
            <Link href="/reporte">
              <Button size="lg" className="w-full sm:w-auto h-10 px-6 text-sm font-medium gap-2">
                Ver mi diagn\u00f3stico completo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
