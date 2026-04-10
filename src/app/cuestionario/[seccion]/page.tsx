import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSectionById, SECTION_IDS } from '@/lib/questions'
import SectionQuestionnaireClient from './SectionClient'

export default async function SectionPage({
  params,
}: {
  params: Promise<{ seccion: string }>
}) {
  const { seccion } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const section = getSectionById(seccion)
  if (!section) redirect('/cuestionario')

  const { data: userData } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user.id)
    .single()

  if (!userData?.clinic_id) redirect('/onboarding')

  const { data: responses } = await supabase
    .from('questionnaire_responses')
    .select('question_key, answer')
    .eq('clinic_id', userData.clinic_id)

  const responseMap: Record<string, string> = {}
  responses?.forEach((r) => {
    responseMap[r.question_key] = r.answer || ''
  })

  const sectionIndex = SECTION_IDS.indexOf(seccion)
  const nextSection = SECTION_IDS[sectionIndex + 1] ?? null
  const prevSection = SECTION_IDS[sectionIndex - 1] ?? null

  return (
    <SectionQuestionnaireClient
      section={section}
      clinicId={userData.clinic_id}
      initialResponses={responseMap}
      nextSection={nextSection}
      prevSection={prevSection}
      isLastSection={sectionIndex === SECTION_IDS.length - 1}
    />
  )
}
