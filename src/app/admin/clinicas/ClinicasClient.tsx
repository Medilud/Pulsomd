'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Download, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ClinicRow {
  id: string
  name: string
  doctor_name?: string
  specialty?: string
  city?: string
  invited_at?: string
  status: string
  progress: number
}

const statusStyles: Record<string, string> = {
  Invitada:      'bg-muted text-muted-foreground border border-border',
  Onboarding:    'bg-blue-50 text-blue-700 border border-blue-100',
  'En progreso': 'bg-amber-50 text-amber-700 border border-amber-100',
  Completada:    'bg-emerald-50 text-emerald-700 border border-emerald-100',
}

export default function AdminClinicasClient({ clinics }: { clinics: ClinicRow[] }) {
  const [filter, setFilter] = useState('Todas')
  const statuses = ['Todas', 'Invitada', 'Onboarding', 'En progreso', 'Completada']

  const filtered = filter === 'Todas'
    ? clinics
    : clinics.filter((c) => c.status === filter)

  function exportCSV() {
    const rows = [
      ['Clinica', 'Doctor', 'Ciudad', 'Status', 'Progreso', 'Fecha invitacion'],
      ...clinics.map((c) => [
        c.name,
        c.doctor_name || '',
        c.city || '',
        c.status,
        `${c.progress}%`,
        c.invited_at ? new Date(c.invited_at).toLocaleDateString('es-MX') : '',
      ]),
    ]
    const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pulsomd-clinicas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
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
                  {clinics.filter((c) => c.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-8 px-3 text-xs">
          <Download className="w-3.5 h-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-xs font-semibold">Cl&#237;nica</TableHead>
              <TableHead className="hidden sm:table-cell text-xs font-semibold">Doctor</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold">Ciudad</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Progreso</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold">Invitada</TableHead>
              <TableHead className="text-right text-xs font-semibold">Acci&#243;n</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                  No hay cl&#237;nicas con este filtro
                </TableCell>
              </TableRow>
            )}
            {filtered.map((clinic) => (
              <TableRow key={clinic.id} className="border-border/60">
                <TableCell className="font-medium text-sm">{clinic.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {clinic.doctor_name || '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {clinic.city || '—'}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusStyles[clinic.status] || statusStyles.Invitada}`}
                  >
                    {clinic.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Progress value={clinic.progress} className="h-1.5 flex-1" />
                    <span className="text-xs tabular-nums text-muted-foreground w-8">{clinic.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {clinic.invited_at
                    ? new Date(clinic.invited_at).toLocaleDateString('es-MX')
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/clinica/${clinic.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                      Ver
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
