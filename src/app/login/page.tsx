'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })
    setLoading(false)
    if (error) {
      toast.error('Ocurrio un error. Intenta de nuevo.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col justify-between p-12">
        <div>
          <p className="text-background/90 font-semibold text-lg tracking-tight">PulsoMD</p>
        </div>
        <div className="space-y-4 max-w-sm">
          <p className="text-[10px] font-semibold tracking-widest text-background/40 uppercase">
            Diagno&#769;stico empresarial
          </p>
          <p className="text-3xl font-bold text-background leading-tight tracking-tight">
            Conoce el pulso real de tu cli&#769;nica.
          </p>
          <p className="text-sm text-background/60 leading-relaxed">
            Revenue no capturado, operaciones optimizables y el camino exacto hacia el crecimiento — todo en un solo reporte.
          </p>
        </div>
        <p className="text-xs text-background/30">
          Acceso exclusivo &mdash; Medilud
        </p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <p className="font-semibold text-lg tracking-tight">PulsoMD</p>
          </div>

          {!sent ? (
            <>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">Acceder</h1>
                <p className="text-sm text-muted-foreground">
                  Ingresa tu correo y te enviamos un enlace de acceso directo.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    Correo electronico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    'Enviando...'
                  ) : (
                    <>
                      Enviar enlace de acceso
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Acceso exclusivo para cli&#769;nicas invitadas por Medilud
              </p>
            </>
          ) : (
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Revisa tu correo</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enviamos un enlace de acceso a{' '}
                  <span className="font-semibold text-foreground">{email}</span>.
                  <br />
                  El enlace expira en 24 horas.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSent(false)}
                className="h-9 text-xs"
              >
                Usar otro correo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
