import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/layout/AppHeader'
import InvitacionesClient from './InvitacionesClient'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default async function AdminInvitacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, email, clinic_name, doctor_name, token, sent_at, used_at')
    .order('sent_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const rows = (invitations || []).map((inv) => ({
    ...inv,
    inviteUrl: `${appUrl}/invite/${inv.token}`,
    status: (inv.used_at ? 'Usada' : 'Pendiente') as 'Usada' | 'Pendiente',
  }))

  const stats = {
    total: rows.length,
    pendientes: rows.filter((r) => r.status === 'Pendiente').length,
    usadas: rows.filter((r) => r.status === 'Usada').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isAdmin />

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Panel de administraci&#243;n
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Invitaciones</h1>
          </div>
          <Link href="/admin/invitar">
            <Button size="sm" className="h-9 px-4 gap-2 text-sm">
              <Mail className="w-3.5 h-3.5" />
              Nueva invitaci&#243;n
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total enviadas', value: stats.total },
            { label: 'Pendientes', value: stats.pendientes },
            { label: 'Completadas', value: stats.usadas },
          ].map((s) => (
            <div key={s.label} className="border border-border/60 rounded-xl p-5 bg-card shadow-none">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold">Sin invitaciones todav&#237;a</p>
            <p className="text-xs text-muted-foreground">
              Invita a tu primera cl&#237;nica para comenzar.
            </p>
            <Link href="/admin/invitar">
              <Button size="sm" className="mt-2 gap-2">
                <Mail className="w-3.5 h-3.5" />
                Enviar primera invitaci&#243;n
              </Button>
            </Link>
          </div>
        ) : (
          <InvitacionesClient invitations={rows} />
        )}
      </main>
    </div>
  )
}
