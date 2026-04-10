'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Mail, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationData {
  id: string
  email: string
  clinic_name: string
  doctor_name: string
  token: string
}

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const supabase = createClient()

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    async function fetchInvitation() {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', params.token)
        .is('used_at', null)
        .single()

      if (error || !data) {
        setInvalid(true)
      } else {
        setInvitation(data)
        setEmail(data.email)
        setFullName(data.doctor_name)
      }
      setLoading(false)
    }
    fetchInvitation()
  }, [params.token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return

    setSubmitting(true)

    localStorage.setItem(
      'pulsomd_invite',
      JSON.stringify({
        token: invitation.token,
        clinic_name: invitation.clinic_name,
        doctor_name: fullName,
        invitation_id: invitation.id,
      })
    )

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: fullName,
          role: 'doctor',
          invite_token: invitation.token,
        },
      },
    })

    setSubmitting(false)

    if (error) {
      toast.error('Error al procesar la invitación. Intenta de nuevo.')
    } else {
      setEmailSent(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verificando invitación...</p>
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xl font-bold tracking-tight">Invitación no válida</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este enlace ya fue utilizado o ha expirado.<br />Contacta a tu asesor de Medilud.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="text-center space-y-1">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Medilud &mdash; PulsoMD
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="text-sm text-muted-foreground">
            {invitation?.doctor_name && `Dr./Dra. ${invitation.doctor_name}`}
          </p>
        </div>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-7">
            {emailSent ? (
              <div className="text-center space-y-5 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-lg tracking-tight">Revisa tu correo</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enviamos un enlace de acceso a<br />
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Haz click en el enlace del correo para continuar con el diagnóstico.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Medilud te invita a diagnosticar
                  </p>
                  <p className="text-xl font-bold tracking-tight" style={{ color: 'var(--gold)' }}>
                    {invitation?.clinic_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completa los datos para crear tu acceso.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold">Nombre completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Dr. Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@clinica.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <Button type="submit" className="w-full h-10 gap-2" disabled={submitting}>
                    {submitting ? 'Procesando...' : (
                      <>
                        Comenzar mi diagnóstico
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
