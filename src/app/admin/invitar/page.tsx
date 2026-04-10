'use client'

import { useState } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Send, Copy, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InviteResult {
  email: string
  clinic: string
  inviteUrl: string
  warning?: string
}

export default function AdminInvitarPage() {
  const [form, setForm] = useState({
    email: '',
    doctor_name: '',
    clinic_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InviteResult | null>(null)
  const [copied, setCopied] = useState(false)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error || 'Error al enviar la invitación')
      return
    }

    setResult({
      email: form.email,
      clinic: form.clinic_name,
      inviteUrl: data.inviteUrl,
      warning: data.warning,
    })

    if (!data.warning) {
      toast.success(`Invitación enviada a ${form.email}`)
    }

    setForm({ email: '', doctor_name: '', clinic_name: '' })
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Enlace copiado al portapapeles')
    setTimeout(() => setCopied(false), 2500)
  }

  function sendAnother() {
    setResult(null)
    setCopied(false)
  }

  const hasPreview = form.doctor_name.length > 0 && form.clinic_name.length > 0

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isAdmin />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Back + header */}
        <div className="space-y-4">
          <Link
            href="/admin/clinicas"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Cl&#237;nicas
          </Link>
          <div className="space-y-1 border-b border-border/60 pb-6">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              Panel de administraci&#243;n
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Invitar cl&#237;nica</h1>
            <p className="text-sm text-muted-foreground">
              Genera un enlace &#250;nico de acceso para el doctor.
            </p>
          </div>
        </div>

        {/* ── Post-submit result ── */}
        {result ? (
          <div className="space-y-4">
            {/* Warning: email not sent */}
            {result.warning && (
              <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-amber-800">Email no enviado</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{result.warning}</p>
                </div>
              </div>
            )}

            {/* Invite URL card */}
            <Card className="border border-border/60 shadow-none">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {result.warning ? 'Enlace de invitación' : 'Invitación enviada'}
                  </p>
                  <p className="text-base font-bold tracking-tight">{result.clinic}</p>
                  <p className="text-sm text-muted-foreground">{result.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {result.warning ? 'Comparte este enlace manualmente' : 'Enlace generado'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted border border-border/60 rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate select-all">
                      {result.inviteUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 gap-1.5 flex-shrink-0"
                      onClick={() => copyUrl(result.inviteUrl)}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    El enlace es de uso &#250;nico y expira cuando el doctor completa el acceso.
                  </p>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={sendAnother}
                  >
                    Invitar otra cl&#237;nica
                  </Button>
                  <Link href="/admin/invitaciones" className="flex-1">
                    <Button variant="ghost" className="w-full text-muted-foreground">
                      Ver historial
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ── Form ── */
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="doctor_name" className="text-xs font-semibold">
                    Nombre del doctor
                  </Label>
                  <Input
                    id="doctor_name"
                    placeholder="Dr. Juan Pérez"
                    value={form.doctor_name}
                    onChange={(e) => set('doctor_name', e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clinic_name" className="text-xs font-semibold">
                    Nombre de la cl&#237;nica
                  </Label>
                  <Input
                    id="clinic_name"
                    placeholder="Clínica Estética Dr. Pérez"
                    value={form.clinic_name}
                    onChange={(e) => set('clinic_name', e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Correo electr&#243;nico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinica.com"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                {/* Email preview */}
                {hasPreview && (
                  <>
                    <Separator />
                    <div className="space-y-2.5">
                      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Vista previa del email
                      </p>
                      <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
                        <div className="flex gap-2 text-xs">
                          <span className="text-muted-foreground w-14 flex-shrink-0">Para:</span>
                          <span className="font-medium">{form.email || 'doctor@clinica.com'}</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-muted-foreground w-14 flex-shrink-0">Asunto:</span>
                          <span className="font-medium">{form.doctor_name}, te invitamos a conocer el pulso de tu cl&#237;nica</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                          <p>Dr./Dra. {form.doctor_name},</p>
                          <p>Medilud te invita a diagnosticar <strong className="text-foreground">{form.clinic_name}</strong> y descubrir el revenue que a&#250;n no est&#225;s capturando.</p>
                          <p className="text-xs font-semibold text-foreground pt-1">[ COMENZAR MI DIAGN&#211;STICO → ]</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 gap-2"
                  disabled={loading || !form.email || !form.doctor_name || !form.clinic_name}
                >
                  {loading ? (
                    'Generando invitación...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Enviar invitación
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
