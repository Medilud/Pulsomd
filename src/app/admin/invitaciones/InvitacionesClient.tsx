'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InvitationRow {
  id: string
  email: string
  clinic_name: string
  doctor_name: string
  inviteUrl: string
  sent_at: string | null
  used_at: string | null
  status: 'Pendiente' | 'Usada'
}

const statusStyle = {
  Pendiente: 'bg-amber-50 text-amber-700 border border-amber-100',
  Usada:     'bg-emerald-50 text-emerald-700 border border-emerald-100',
}

export default function InvitacionesClient({
  invitations,
}: {
  invitations: InvitationRow[]
}) {
  const [filter, setFilter] = useState<'Todas' | 'Pendiente' | 'Usada'>('Todas')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [newUrls, setNewUrls] = useState<Record<string, string>>({})

  const filtered = filter === 'Todas'
    ? invitations
    : invitations.filter((i) => i.status === filter)

  async function copyLink(id: string, url: string) {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Enlace copiado')
    setTimeout(() => setCopiedId(null), 2500)
  }

  async function resend(invitation: InvitationRow) {
    setResendingId(invitation.id)

    const res = await fetch('/api/invite', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_id: invitation.id }),
    })

    const data = await res.json()
    setResendingId(null)

    if (!res.ok) {
      toast.error(data.error || 'Error al reenviar')
      return
    }

    // Store the new URL for this row
    setNewUrls((prev) => ({ ...prev, [invitation.id]: data.inviteUrl }))

    if (data.warning) {
      toast.info('Nueva invitaci\u00f3n creada. Copia el enlace para compartirlo manualmente.', {
        duration: 5000,
      })
    } else {
      toast.success(`Email reenviado a ${invitation.email}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {(['Todas', 'Pendiente', 'Usada'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 border border-border/60'
            }`}
          >
            {s}
            {s !== 'Todas' && (
              <span className="ml-1 opacity-60">
                {invitations.filter((i) => i.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs font-semibold">Doctor</TableHead>
              <TableHead className="hidden sm:table-cell text-xs font-semibold">Cl&#237;nica</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold">Email</TableHead>
              <TableHead className="text-xs font-semibold">Estado</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold">Enviada</TableHead>
              <TableHead className="text-right text-xs font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                  No hay invitaciones con este filtro
                </TableCell>
              </TableRow>
            )}
            {filtered.map((inv) => {
              const activeUrl = newUrls[inv.id] || inv.inviteUrl
              const isCopied = copiedId === inv.id
              const isResending = resendingId === inv.id
              const hasNewUrl = !!newUrls[inv.id]

              return (
                <TableRow key={inv.id} className="border-border/60 align-middle">
                  <TableCell className="font-medium text-sm">{inv.doctor_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {inv.clinic_name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {inv.email}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusStyle[inv.status]}`}>
                      {inv.status}
                    </span>
                    {hasNewUrl && (
                      <span className="ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Nuevo link
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {inv.sent_at
                      ? new Date(inv.sent_at).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      : '—'}
                    {inv.used_at && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        Usada {new Date(inv.used_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Copy link — always visible for pending, also after resend */}
                      {(inv.status === 'Pendiente' || hasNewUrl) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1.5"
                          onClick={() => copyLink(inv.id, activeUrl)}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar link
                            </>
                          )}
                        </Button>
                      )}
                      {/* Resend — only for pending invitations */}
                      {inv.status === 'Pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                          disabled={isResending}
                          onClick={() => resend(inv)}
                        >
                          <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                          {isResending ? 'Enviando...' : 'Reenviar'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Note about copy links */}
      <p className="text-xs text-muted-foreground">
        Si el email no llega, usa <strong>Copiar link</strong> para compartir la invitaci&#243;n manualmente por WhatsApp o email.
      </p>
    </div>
  )
}
