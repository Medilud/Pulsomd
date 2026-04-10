'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEMO_RESPONSES } from '@/lib/demo-data'
import { getSectionById, SECTION_IDS, calculateSectionProgress } from '@/lib/questions'
import QuestionForm from '@/components/questionnaire/QuestionForm'
import AutoSaveIndicator from '@/components/questionnaire/AutoSaveIndicator'
import SectionIcon from '@/components/ui/SectionIcon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DemoSectionPage() {
  const params = useParams<{ seccion: string }>()
  const router = useRouter()
  const section = getSectionById(params.seccion)

  const [responses, setResponses] = useState<Record<string, string>>(DEMO_RESPONSES)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  if (!section) {
    router.push('/demo/cuestionario')
    return null
  }

  const sectionIndex = SECTION_IDS.indexOf(params.seccion)
  const prevSection = SECTION_IDS[sectionIndex - 1] ?? null
  const nextSection = SECTION_IDS[sectionIndex + 1] ?? null
  const isLast = sectionIndex === SECTION_IDS.length - 1

  function handleChange(key: string, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }))
    setSaveStatus('saving')
    setTimeout(() => setSaveStatus('saved'), 600)
    setTimeout(() => setSaveStatus('idle'), 2600)
  }

  function handleNext() {
    if (isLast) {
      toast.success('Diagno&#769;stico completado. Generando tu reporte...')
      router.push('/demo/reporte')
    } else if (nextSection) {
      router.push(`/demo/cuestionario/${nextSection}`)
    }
  }

  const sectionProgress = calculateSectionProgress(section.id, responses)
  const totalSections = SECTION_IDS.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/60">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/demo/cuestionario">
            <span className="font-semibold text-base tracking-tight">PulsoMD</span>
          </Link>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={saveStatus} />
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
              DEMO
            </span>
          </div>
        </div>
        {/* Section progress bar */}
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-foreground transition-all duration-300"
            style={{ width: `${((sectionIndex + 1) / totalSections) * 100}%` }}
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Back nav */}
        <Link
          href={prevSection ? `/demo/cuestionario/${prevSection}` : '/demo/cuestionario'}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {prevSection ? 'Sección anterior' : 'Ver todas las secciones'}
        </Link>

        {/* Section header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <SectionIcon name={section.icon} className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Sección {sectionIndex + 1} de {totalSections}
              </p>
              <h1 className="text-xl font-bold tracking-tight">{section.title}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{section.description}</p>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progreso de esta sección</span>
              <span className="font-medium tabular-nums">{sectionProgress}%</span>
            </div>
            <Progress value={sectionProgress} className="h-1.5" />
          </div>
        </div>

        {/* Form */}
        <div className="bg-card rounded-xl border border-border/60 p-6">
          <QuestionForm
            questions={section.questions}
            responses={responses}
            onChange={handleChange}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pb-8">
          {prevSection && (
            <Button
              variant="outline"
              onClick={() => router.push(`/demo/cuestionario/${prevSection}`)}
              className="flex-1 h-10 gap-1.5 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1 h-10 gap-1.5 text-sm">
            {isLast ? 'Finalizar diagnóstico' : 'Siguiente sección'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
