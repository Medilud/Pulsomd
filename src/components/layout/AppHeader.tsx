'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { LayoutDashboard, ClipboardList, FileText, Users, Mail, History, LogOut } from 'lucide-react'

interface AppHeaderProps {
  clinicName?: string
  isAdmin?: boolean
}

export default function AppHeader({ clinicName, isAdmin }: AppHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Sesion cerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border/60">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={isAdmin ? '/admin/clinicas' : '/dashboard'}>
            <span className="font-semibold text-base tracking-tight">PulsoMD</span>
          </Link>
          {clinicName && (
            <>
              <span className="text-border hidden sm:block">|</span>
              <span className="text-sm text-muted-foreground hidden sm:block">{clinicName}</span>
            </>
          )}
        </div>

        <nav className="flex items-center gap-5">
          {!isAdmin && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                href="/cuestionario"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Cuestionario
              </Link>
              <Link
                href="/reporte"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <FileText className="w-3.5 h-3.5" />
                Reporte
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link
                href="/admin/clinicas"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <Users className="w-3.5 h-3.5" />
                Clinicas
              </Link>
              <Link
                href="/admin/invitaciones"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <History className="w-3.5 h-3.5" />
                Invitaciones
              </Link>
              <Link
                href="/admin/invitar"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
              >
                <Mail className="w-3.5 h-3.5" />
                Invitar
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </Button>
        </nav>
      </div>
    </header>
  )
}
