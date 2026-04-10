import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/layout/AppHeader'
import AdminClinicasClient from './ClinicasClient'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default async function AdminClinicasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clinics } = await supabase
    .from('clinics')
    .select(`
      id,
      name,
      doctor_name,
      specialty,
      city,
      invited_at,
      onboarded_at,
      questionnaire_completed_at,
      patients_per_month
    `)
    .order('invited_at', { ascending: false })

  const { data: responseCounts } = await supabase
    .from('questionnaire_responses')
    .select('clinic_id')

  const responseByClinic: Record<string, number> = {}
  responseCounts?.forEach((r) => {
    responseByClinic[r.clinic_id] = (responseByClinic[r.clinic_id] || 0) + 1
  })

  const TOTAL_REQUIRED = 31

  const clinicsWithProgress = (clinics || []).map((c) => {
    const answered = responseByClinic[c.id] || 0
    const progress = Math.min(100, Math.round((answered / TOTAL_REQUIRED) * 100))

    let status: string
    if (c.questionnaire_completed_at) status = 'Completada'
    else if (answered > 0) status = 'En progreso'
    else if (c.onboarded_at) status = 'Onboarding'
    else status = 'Invitada'

    return { ...c, progress, status }
  })

  const stats = {
    total: clinicsWithProgress.length,
    completadas: clinicsWithProgress.filter(c => c.status === 'Completada').length,
    enProgreso: clinicsWithProgress.filter(c => c.status === 'En progreso').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isAdmin />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Panel de administraci&#243;n
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Cl&#237;nicas</h1>
          </div>
          <Link href="/admin/invitar">
            <Button size="sm" className="h-9 px-4 gap-2 text-sm">
              <Mail className="w-3.5 h-3.5" />
              Invitar cl&#237;nica
            </Button>
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total registradas', value: stats.total },
            { label: 'En progreso', value: stats.enProgreso },
            { label: 'Completadas', value: stats.completadas },
          ].map((stat) => (
            <div key={stat.label} className="border border-border/60 rounded-xl p-5 bg-card shadow-none">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <AdminClinicasClient clinics={clinicsWithProgress} />
      </main>
    </div>
  )
}
