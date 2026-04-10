'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Section, calculateSectionProgress } from '@/lib/questions'
import { createClient } from '@/lib/supabase/client'
import QuestionForm from '@/components/questionnaire/QuestionForm'
import AutoSaveIndicator from '@/components/questionnaire/AutoSaveIndicator'
import SectionIcon from '@/components/ui/SectionIcon'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface SectionQuestionnaireClientProps {
  section: Section
  clinicId: string
  initialResponses: Record<string, string>
  nextSection: string | null
  prevSection: string | null
  isLastSection: boolean
}

export default function SectionQuestionnaireClient({
  section,
  clinicId,
  initialResponses,
  nextSection,
  prevSection,
  isLastSection,
}: SectionQuestionnaireClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveAnswer = useCallback(
    async (key: string, value: string) => {
      setSaveStatus('saving')
      const { error } = await supabase
        .from('questionnaire_responses')
        .upsert(
          {
            clinic_id: clinicId,
            section: section.id,
            question_key: key,
            answer: value,
            answered_at: new Date().toISOString(),
          },
          { onConflict: 'clinic_id,question_key' }
        )

      if (error) {
        setSaveStatus('error')
      } else {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    },
    [clinicId, section.id, supabase]
  )

  const handleChange = useCallback(
    (key: string, value: string) => {
      setResponses((prev) => ({ ...prev, [key]: value }))

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        saveAnswer(key, value)
      }, 500)
    },
    [saveAnswer]
  )

  async function generateInsights() {
    try {
      await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId }),
      })
    } catch {
      // Non-blocking — insights generation is best-effort
    }
  }

  async function handleNext() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      const pendingKeys = section.questions.map(q => q.key).filter(k => responses[k] !== initialResponses[k])
      for (const key of pendingKeys) {
        if (responses[key] !== undefined) {
          await saveAnswer(key, responses[key])
        }
      }
    }

    const sectionProgress = calculateSectionProgress(section.id, responses)
    if (sectionProgress === 100) {
      await generateInsights()
    }

    if (isLastSection) {
      toast.success('Diagn\u00f3stico completado. Generando tu reporte...')
      router.push('/reporte')
    } else if (nextSection) {
      router.push(`/cuestionario/${nextSection}`)
    } else {
      router.push('/cuestionario')
    }
  }

  const sectionProgress = calculateSectionProgress(section.id, responses)

  return (
    <div className="min-h-screen bg-background">
      {/* Progress strip */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href={prevSection ? `/cuestionario/${prevSection}` : '/cuestionario'}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {prevSection ? 'Anterior' : 'Secciones'}
          </Link>
          <div className="flex-1 space-y-1">
            <Progress value={sectionProgress} className="h-1" />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs tabular-nums text-muted-foreground">{sectionProgress}%</span>
            <AutoSaveIndicator status={saveStatus} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Section header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <SectionIcon name={section.icon} className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{section.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="border border-border/60 rounded-xl bg-card p-7 shadow-none">
          <QuestionForm
            questions={section.questions}
            responses={responses}
            onChange={handleChange}
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {prevSection && (
            <Button
              variant="outline"
              onClick={() => router.push(`/cuestionario/${prevSection}`)}
              className="gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 gap-1.5"
          >
            {isLastSection
              ? sectionProgress === 100
                ? 'Finalizar diagn\u00f3stico'
                : 'Guardar y terminar'
              : nextSection
              ? 'Siguiente secci\u00f3n'
              : 'Guardar'}
            {!isLastSection && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
