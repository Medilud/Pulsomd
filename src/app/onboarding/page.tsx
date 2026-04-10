'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Stethoscope, TrendingUp, ClipboardList, Clock, Check, ChevronRight } from 'lucide-react'

const SPECIALTIES = ['Medicina Estética', 'Dermatología', 'Cirugía Plástica', 'Mixta']

const STEPS = [
  { number: 1, title: 'Datos de tu clínica' },
  { number: 2, title: '¿Qué es PulsoMD?' },
  { number: 3, title: 'Listo para comenzar' },
]

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Diagnóstico completo de tu negocio',
    desc: 'Evaluamos 6 áreas clave: operaciones, finanzas, equipo, pacientes, tecnología y perfil general.',
  },
  {
    icon: TrendingUp,
    title: 'Oportunidades cuantificadas',
    desc: 'Te decimos exactamente cuánto dinero hay en juego en cada área de mejora, en pesos mexicanos.',
  },
  {
    icon: ClipboardList,
    title: 'Plan de acción específico',
    desc: 'No solo el diagnóstico — los pasos concretos, el timeline y el responsable de cada acción.',
  },
  {
    icon: Clock,
    title: '15 minutos, impacto permanente',
    desc: 'El cuestionario toma menos de 15 minutos. Tu progreso se guarda automáticamente.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [clinicId, setClinicId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    years_operating: '',
    rooms: '',
    patients_per_month: '',
    city: '',
  })

  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('clinic_id, clinics(*)')
        .eq('id', user.id)
        .single()

      if (userData?.clinic_id) {
        setClinicId(userData.clinic_id)
        if ((userData as { clinics?: { onboarded_at?: string } })?.clinics?.onboarded_at) {
          router.push('/cuestionario')
        }
      }

      const inviteData = localStorage.getItem('pulsomd_invite')
      if (inviteData) {
        const parsed = JSON.parse(inviteData)
        setForm(prev => ({ ...prev, name: parsed.clinic_name || '' }))
      }
    }
    checkExisting()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function saveClinicData() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Sesión expirada. Por favor inicia sesión de nuevo.')
      return
    }

    const clinicData = {
      name: form.name,
      specialty: form.specialty,
      years_operating: form.years_operating ? parseInt(form.years_operating) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      patients_per_month: form.patients_per_month ? parseInt(form.patients_per_month) : null,
      city: form.city,
      invited_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
    }

    let currentClinicId = clinicId

    if (!currentClinicId) {
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert([clinicData])
        .select('id')
        .single()

      if (clinicError || !clinic) {
        toast.error('Error al guardar los datos. Intenta de nuevo.')
        setSaving(false)
        return
      }
      currentClinicId = clinic.id
      setClinicId(clinic.id)

      await supabase.from('users').update({ clinic_id: clinic.id }).eq('id', user.id)

      const inviteData = localStorage.getItem('pulsomd_invite')
      if (inviteData) {
        const parsed = JSON.parse(inviteData)
        await supabase
          .from('invitations')
          .update({ used_at: new Date().toISOString() })
          .eq('token', parsed.token)
        localStorage.removeItem('pulsomd_invite')
      }
    } else {
      await supabase
        .from('clinics')
        .update({ ...clinicData, onboarded_at: new Date().toISOString() })
        .eq('id', currentClinicId)
    }

    setSaving(false)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-7">

        {/* Logo */}
        <div className="text-center">
          <p className="font-semibold text-base tracking-tight">PulsoMD</p>
          <p className="text-xs text-muted-foreground mt-0.5">por Medilud</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.number
                    ? 'bg-foreground text-background'
                    : step > s.number
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted text-muted-foreground/40'
                }`}
              >
                {step > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-14 mx-1 transition-colors ${
                    step > s.number ? 'bg-emerald-200' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Clinic data */}
        {step === 1 && (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-7 space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Datos de tu clínica</h2>
                <p className="text-sm text-muted-foreground">
                  Esta información personaliza tu diagnóstico.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nombre de la clínica <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Clínica Estética Dr. Pérez"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Especialidad principal <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.specialty ?? ''} onValueChange={(v) => set('specialty', v ?? '')}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Años en operación
                    </Label>
                    <Input
                      type="number" min="0" placeholder="ej: 5"
                      value={form.years_operating}
                      onChange={e => set('years_operating', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Consultorios
                    </Label>
                    <Input
                      type="number" min="1" placeholder="ej: 2"
                      value={form.rooms}
                      onChange={e => set('rooms', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Pacientes / mes
                    </Label>
                    <Input
                      type="number" min="0" placeholder="ej: 80"
                      value={form.patients_per_month}
                      onChange={e => set('patients_per_month', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Ciudad
                    </Label>
                    <Input
                      placeholder="ej: CDMX"
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-10 gap-2"
                onClick={saveClinicData}
                disabled={saving || !form.name || !form.specialty}
              >
                {saving ? 'Guardando...' : <><span>Continuar</span><ChevronRight className="w-4 h-4" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — What is PulsoMD */}
        {step === 2 && (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-7 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Tu herramienta
                </p>
                <h2 className="text-xl font-bold tracking-tight">¿Qué es PulsoMD?</h2>
                <p className="text-sm text-muted-foreground">
                  Tu diagnóstico empresarial personalizado.
                </p>
              </div>

              <div className="space-y-5">
                {FEATURES.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.title} className="flex gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{f.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button className="w-full h-10 gap-2" onClick={() => setStep(3)}>
                Entendido, continuar
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Ready */}
        {step === 3 && (
          <Card className="border border-border/60 shadow-none">
            <CardContent className="p-7 space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">Todo listo</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Responde las 6 secciones sobre tu clínica. Al terminar, recibirás tu diagnóstico con las oportunidades de crecimiento más importantes.
                  </p>
                </div>
              </div>

              <div className="border border-border/60 rounded-xl p-4 space-y-2.5 bg-muted/30">
                <p className="text-xs font-semibold text-foreground">A tener en cuenta</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {[
                    'Puedes pausar y continuar cuando quieras',
                    'Tus respuestas se guardan automáticamente',
                    'No hay respuestas correctas o incorrectas',
                    'Mientras más detallado, mejor el diagnóstico',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="w-full h-10 gap-2"
                onClick={() => router.push('/cuestionario')}
              >
                Comenzar diagnóstico
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
