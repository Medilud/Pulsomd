export type QuestionType = 'select' | 'multi-select' | 'number' | 'text'

export interface Question {
  key: string
  label: string
  type: QuestionType
  options?: string[]
  placeholder?: string
  required?: boolean
}

export interface Section {
  id: string
  title: string
  description: string
  icon: string
  questions: Question[]
}

export const SECTIONS: Section[] = [
  {
    id: 'perfil',
    title: 'Perfil de la Clinica',
    description: 'Datos generales sobre tu clinica y operacion',
    icon: 'building-2',
    questions: [
      {
        key: 'clinic_specialty',
        label: 'Especialidad principal',
        type: 'select',
        options: ['Medicina Estetica', 'Dermatologia', 'Cirugia Plastica', 'Mixta'],
        required: true,
      },
      {
        key: 'clinic_years',
        label: 'Anos en operacion',
        type: 'number',
        placeholder: 'ej: 5',
        required: true,
      },
      {
        key: 'clinic_rooms',
        label: 'Numero de consultorios',
        type: 'number',
        placeholder: 'ej: 2',
        required: true,
      },
      {
        key: 'clinic_patients_month',
        label: 'Pacientes atendidos por mes (aproximado)',
        type: 'number',
        placeholder: 'ej: 80',
        required: true,
      },
      {
        key: 'clinic_city',
        label: 'Ciudad',
        type: 'text',
        placeholder: 'ej: Ciudad de Mexico',
        required: true,
      },
    ],
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    description: 'Como funciona el dia a dia de tu clinica',
    icon: 'settings-2',
    questions: [
      {
        key: 'ops_scheduling',
        label: 'Como agenda sus citas actualmente',
        type: 'select',
        options: ['Telefono', 'WhatsApp', 'App/Sistema', 'Agenda manual'],
        required: true,
      },
      {
        key: 'ops_confirmation',
        label: 'Tiene proceso de confirmacion de citas',
        type: 'select',
        options: ['Si automatico', 'Si manual', 'No'],
        required: true,
      },
      {
        key: 'ops_cancellation_rate',
        label: 'Tasa estimada de cancelaciones / no-shows',
        type: 'select',
        options: ['Menos del 10%', '10-20%', '20-30%', 'Mas del 30%'],
        required: true,
      },
      {
        key: 'ops_avg_consult_time',
        label: 'Tiempo promedio por consulta (minutos)',
        type: 'number',
        placeholder: 'ej: 45',
      },
      {
        key: 'ops_schedule_hours',
        label: 'Horario de atencion',
        type: 'text',
        placeholder: 'ej: Lunes a Viernes 9am-7pm',
      },
      {
        key: 'ops_reception_staff',
        label: 'Tiene personal de recepcion dedicado',
        type: 'select',
        options: ['Si, tiempo completo', 'Si, tiempo parcial', 'No'],
        required: true,
      },
      {
        key: 'ops_bottleneck',
        label: 'Cual es el mayor cuello de botella en sus operaciones',
        type: 'text',
        placeholder: 'Describe el principal problema operativo...',
      },
    ],
  },
  {
    id: 'finanzas',
    title: 'Finanzas',
    description: 'El motor economico de tu clinica',
    icon: 'trending-up',
    questions: [
      {
        key: 'fin_avg_ticket',
        label: 'Ticket promedio por consulta o tratamiento (MXN)',
        type: 'number',
        placeholder: 'ej: 8000',
        required: true,
      },
      {
        key: 'fin_payment_methods',
        label: 'Metodos de pago que acepta',
        type: 'multi-select',
        options: ['Efectivo', 'Tarjeta', 'Transferencia', 'Credito medico'],
        required: true,
      },
      {
        key: 'fin_accounting',
        label: 'Como lleva su contabilidad',
        type: 'select',
        options: [
          'Contador externo',
          'Software (SAP, Contpaq, etc)',
          'Hoja de calculo',
          'No lleva control formal',
        ],
        required: true,
      },
      {
        key: 'fin_top_treatments',
        label: 'Top 3 tratamientos mas rentables',
        type: 'text',
        placeholder: 'ej: Botox, Rellenos, Peeling quimico',
      },
      {
        key: 'fin_fixed_costs',
        label: 'Conoce sus costos fijos mensuales con precision',
        type: 'select',
        options: ['Si, exactamente', 'Aproximadamente', 'No'],
        required: true,
      },
      {
        key: 'fin_revenue_goal',
        label: 'Objetivo de facturacion mensual (MXN)',
        type: 'number',
        placeholder: 'ej: 500000',
      },
      {
        key: 'fin_growth_vs_last_year',
        label: 'Como compara su facturacion vs el ano pasado',
        type: 'select',
        options: [
          'Crecio mas del 20%',
          'Crecio entre 5-20%',
          'Se mantuvo igual',
          'Bajo',
        ],
        required: true,
      },
    ],
  },
  {
    id: 'equipo',
    title: 'Equipo',
    description: 'Las personas detras de tu clinica',
    icon: 'users',
    questions: [
      {
        key: 'team_total',
        label: 'Total de empleados (incluyendo doctor)',
        type: 'number',
        placeholder: 'ej: 4',
        required: true,
      },
      {
        key: 'team_has_nurse',
        label: 'Tiene enfermeras o asistentes medicos',
        type: 'select',
        options: ['Si', 'No'],
        required: true,
      },
      {
        key: 'team_has_coordinator',
        label: 'Tiene coordinador de pacientes o experiencia',
        type: 'select',
        options: ['Si', 'No'],
        required: true,
      },
      {
        key: 'team_has_marketing',
        label: 'Tiene alguien dedicado a marketing / redes sociales',
        type: 'select',
        options: ['Si, interno', 'Si, externo (agencia)', 'No'],
        required: true,
      },
      {
        key: 'team_training',
        label: 'Como capacita a su equipo',
        type: 'select',
        options: ['Capacitaciones formales', 'On the job', 'No hay proceso formal'],
        required: true,
      },
      {
        key: 'team_main_challenge',
        label: 'Principal reto con su equipo hoy',
        type: 'text',
        placeholder: 'Describe el mayor reto con tu equipo...',
      },
    ],
  },
  {
    id: 'journey',
    title: 'Journey del Paciente',
    description: 'Como captas, retienes y haces crecer a tus pacientes',
    icon: 'route',
    questions: [
      {
        key: 'journey_acquisition',
        label: 'Como llegan sus nuevos pacientes',
        type: 'multi-select',
        options: ['Referidos', 'Instagram', 'Google', 'Facebook', 'Otro'],
        required: true,
      },
      {
        key: 'journey_instagram',
        label: 'Tiene cuenta de Instagram activa para su clinica',
        type: 'select',
        options: [
          'Si, activa con contenido regular',
          'Si, pero poco activa',
          'No',
        ],
        required: true,
      },
      {
        key: 'journey_return_rate',
        label: 'Porcentaje estimado de pacientes que regresan',
        type: 'select',
        options: ['Mas del 60%', '40-60%', '20-40%', 'Menos del 20%'],
        required: true,
      },
      {
        key: 'journey_followup',
        label: 'Tiene proceso de seguimiento post-consulta',
        type: 'select',
        options: ['Si, automatizado', 'Si, manual', 'No'],
        required: true,
      },
      {
        key: 'journey_upsell',
        label: 'Ofrece tratamientos complementarios en consulta',
        type: 'select',
        options: ['Siempre', 'A veces', 'Raramente', 'No'],
        required: true,
      },
      {
        key: 'journey_loyalty',
        label: 'Tiene programa de referidos o lealtad',
        type: 'select',
        options: ['Si', 'No', 'En proceso'],
        required: true,
      },
      {
        key: 'journey_reviews',
        label: 'Solicita resenas a sus pacientes',
        type: 'select',
        options: ['Si, activamente', 'A veces', 'No'],
        required: true,
      },
    ],
  },
  {
    id: 'tecnologia',
    title: 'Tecnologia y Sistemas',
    description: 'Las herramientas que potencian o frenan tu clinica',
    icon: 'monitor',
    questions: [
      {
        key: 'tech_mgmt_software',
        label: 'Software de gestion de clinica que usa',
        type: 'select',
        options: [
          'Ninguno',
          'Excel/Sheets',
          'Software especializado (especificar)',
          'App propia',
        ],
        required: true,
      },
      {
        key: 'tech_ehr',
        label: 'Maneja expediente electronico del paciente',
        type: 'select',
        options: ['Si', 'No', 'En proceso'],
        required: true,
      },
      {
        key: 'tech_website',
        label: 'Tiene sitio web propio',
        type: 'select',
        options: ['Si, actualizado', 'Si, desactualizado', 'No'],
        required: true,
      },
      {
        key: 'tech_payment_system',
        label: 'Sistema de punto de venta',
        type: 'select',
        options: ['Terminal bancaria', 'App (Clip, etc)', 'Solo efectivo', 'Otro'],
        required: true,
      },
      {
        key: 'tech_biggest_gap',
        label: 'Cual es la herramienta tecnologica que mas le hace falta',
        type: 'text',
        placeholder: 'Describe la herramienta que necesitas...',
      },
    ],
  },
]

export const SECTION_IDS = SECTIONS.map((s) => s.id)

export function getSectionById(id: string): Section | undefined {
  return SECTIONS.find((s) => s.id === id)
}

export function getSectionIndex(id: string): number {
  return SECTIONS.findIndex((s) => s.id === id)
}

export function getNextSection(currentId: string): Section | undefined {
  const idx = getSectionIndex(currentId)
  return SECTIONS[idx + 1]
}

export function getPrevSection(currentId: string): Section | undefined {
  const idx = getSectionIndex(currentId)
  return idx > 0 ? SECTIONS[idx - 1] : undefined
}

export function calculateSectionProgress(
  sectionId: string,
  responses: Record<string, string>
): number {
  const section = getSectionById(sectionId)
  if (!section) return 0
  const required = section.questions.filter((q) => q.required)
  if (required.length === 0) return 100
  const answered = required.filter(
    (q) => responses[q.key] && responses[q.key].trim() !== ''
  )
  return Math.round((answered.length / required.length) * 100)
}

export function calculateOverallProgress(responses: Record<string, string>): number {
  const allRequired = SECTIONS.flatMap((s) => s.questions.filter((q) => q.required))
  if (allRequired.length === 0) return 0
  const answered = allRequired.filter(
    (q) => responses[q.key] && responses[q.key].trim() !== ''
  )
  return Math.round((answered.length / allRequired.length) * 100)
}
