import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, ClipboardList, Settings2, FileText, ChevronRight } from 'lucide-react'

const screens = [
  {
    href: '/demo/dashboard',
    label: 'Dashboard',
    desc: 'Health Score, Quick Wins y progreso del diagnostico',
    icon: BarChart3,
  },
  {
    href: '/demo/cuestionario',
    label: 'Cuestionario',
    desc: 'Vista general de las 6 secciones del diagnostico',
    icon: ClipboardList,
  },
  {
    href: '/demo/cuestionario/operaciones',
    label: 'Seccion: Operaciones',
    desc: 'Formulario interactivo con auto-guardado',
    icon: Settings2,
  },
  {
    href: '/demo/reporte',
    label: 'Reporte completo',
    desc: 'Diagnostico detallado, benchmarks y recomendaciones',
    icon: FileText,
  },
]

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">

        {/* Logo + intro */}
        <div className="text-center space-y-3">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Vista previa
          </p>
          <h1 className="text-4xl font-bold tracking-tight">PulsoMD</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Diagno&#769;stico empresarial para cli&#769;nicas este&#769;ticas. Navega el portal con datos de ejemplo.
          </p>
        </div>

        {/* Screen cards */}
        <div className="space-y-2">
          {screens.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.href} href={s.href}>
                <Card className="border border-border/60 shadow-none hover:border-border hover:shadow-sm transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-muted/70 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-muted-foreground">
          Datos ficticios &mdash; Cli&#769;nica Este&#769;tica Dr. Vargas, Guadalajara
        </p>
      </div>
    </div>
  )
}
