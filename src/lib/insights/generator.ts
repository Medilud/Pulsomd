// PulsoMD Insights Generator — implements spec sections 7C + 7D exactly

import { calculateRevenueFugas, formatMXN } from '../revenue/calculator'

export interface Insight {
  title: string
  description: string
  action_steps: string[]
  timeline: string
  responsible: string
  category: string
  impact: 'alto' | 'medio' | 'bajo'
  effort: 'alto' | 'medio' | 'bajo'
  urgency_level: 1 | 2 | 3  // 1=immediate, 2=optimize, 3=scale
  revenue_mxn: number
  priority_score: number
  is_highlighted: boolean
}

const impactoPts = { alto: 3, medio: 2, bajo: 1 }
const esfuerzoPts = { bajo: 3, medio: 2, alto: 1 }  // inverted

function calcPriority(impact: 'alto'|'medio'|'bajo', effort: 'alto'|'medio'|'bajo', revenue: number): number {
  return (impactoPts[impact] / esfuerzoPts[effort]) * (revenue > 0 ? 1.5 : 1.0)
}

export function generateInsights(responses: Record<string, string>): Insight[] {
  const fugas = calculateRevenueFugas(responses)
  const insights: Omit<Insight, 'priority_score' | 'is_highlighted'>[] = []

  // ============================================================
  // NIVEL 1 — RECUPERACION INMEDIATA
  // ============================================================

  // INSIGHT: Confirmacion automatica de citas
  if (responses.ops_confirmation !== 'Si automatico') {
    const impactoTexto = fugas.hasData
      ? ` Con tu volumen actual de ${fugas.pxMes} pacientes al mes, incluso una tasa de 15% de no-shows representa ${formatMXN(fugas.fugaCancelaciones)} MXN perdidos mensualmente — sin contar el costo de oportunidad del consultorio vacio.`
      : ' Las clinicas esteticas pierden entre 15-25% de su revenue potencial por cancelaciones sin gestion activa.'

    insights.push({
      title: 'Confirma automaticamente tus citas',
      description: `Cada cita sin confirmar es un riesgo de ingreso.${impactoTexto}`,
      action_steps: [
        'Configura una secuencia de WhatsApp con 3 mensajes: 48h antes (confirmacion con boton), 24h antes (recordatorio), 2h antes (recordatorio final)',
        'Designa a tu asistente como responsable de monitorear respuestas',
        'Para clinicas con > 50 citas/mes: considera Wati, Respond.io o Brevo para automatizar',
        'Mide el delta de cancelaciones en 30 dias',
      ],
      timeline: '1-3 dias para implementar',
      responsible: 'Asistente / Coordinador',
      category: 'Operaciones',
      impact: 'alto',
      effort: 'bajo',
      urgency_level: 1,
      revenue_mxn: fugas.fugaCancelaciones,
    })
  }

  // INSIGHT: Seguimiento post-consulta
  if (responses.journey_followup === 'No') {
    const texto = fugas.hasData
      ? ` Con tu tasa de retorno actual y ${fugas.pxMes} pacientes al mes, un protocolo basico de seguimiento puede recuperar hasta ${formatMXN(fugas.retornoPotencial)}/mes.`
      : ' El 68% de los pacientes que no regresan no lo hacen porque se sintieron olvidados, no porque esten insatisfechos.'

    insights.push({
      title: 'Empieza a hacer seguimiento post-consulta',
      description: `El 68% de los pacientes que no regresan no lo hacen porque se sintieron olvidados, no porque esten insatisfechos.${texto}`,
      action_steps: [
        'Crea una secuencia de 3 mensajes post-consulta: 48h despues (como te sentiste?), 2 semanas (contenido de valor), 6 semanas (es momento de tu siguiente sesion)',
        'Segmenta por tipo de tratamiento — el mensaje para rinoplastia no es el mismo que para botox',
        'Lleva un registro de quienes respondieron vs quienes no — son listas de accion distintas',
        'Meta: 30% de tasa de respuesta en los primeros 60 dias',
      ],
      timeline: '3-5 dias para armar los mensajes',
      responsible: 'Asistente / Doctor para revisar el tono',
      category: 'Journey del Paciente',
      impact: 'alto',
      effort: 'bajo',
      urgency_level: 1,
      revenue_mxn: fugas.retornoPotencial,
    })
  }

  // INSIGHT: Upsell en consulta
  if (
    responses.journey_upsell === 'Raramente' ||
    responses.journey_upsell === 'No'
  ) {
    const texto = fugas.hasData
      ? ` Con ${fugas.pxMes} pacientes/mes, esto representa ${formatMXN(fugas.fugaUpsell)}/mes en tratamientos que no se estan vendiendo.`
      : ' El momento de mayor apertura del paciente es justo despues de recibir un tratamiento que le gusto.'

    insights.push({
      title: 'Ofrece siempre el siguiente tratamiento en la misma consulta',
      description: `El momento de mayor apertura del paciente es justo despues de recibir un tratamiento que le gusto. Si no ofreces el siguiente paso en ese momento, la probabilidad de que lo busque solo cae un 70%.${texto}`,
      action_steps: [
        "Crea un 'Menu de Siguiente Paso' para cada tratamiento principal: Botox → skinbooster o filler labial; Peeling → plan de mantenimiento mensual",
        "El doctor termina cada consulta con la frase: 'Lo que sigue para ti seria...'",
        "La asistente cierra con: '¿Le agendamos esa cita hoy o prefiere que le enviemos disponibilidad?'",
        'Registra tasa de conversion de upsell por semana',
      ],
      timeline: '1 dia (solo requiere crear el menu y ensayarlo)',
      responsible: 'Doctor + Asistente',
      category: 'Journey del Paciente',
      impact: 'alto',
      effort: 'bajo',
      urgency_level: 1,
      revenue_mxn: fugas.fugaUpsell,
    })
  }

  // ============================================================
  // NIVEL 2 — OPTIMIZACION
  // ============================================================

  // INSIGHT: Control financiero
  if (
    responses.fin_accounting === 'Hoja de calculo' ||
    responses.fin_accounting === 'No lleva control formal'
  ) {
    insights.push({
      title: 'Tu clinica no tiene control financiero formal',
      description:
        'Sin saber exactamente cuanto te cuesta operar, es imposible saber si tu clinica es rentable o simplemente factura bien. La diferencia entre una clinica que factura $500K MXN/mes y una que gana dinero de verdad esta en el control de costos. Este es el primer punto ciego que bloquea el escalamiento.',
      action_steps: [
        'En los proximos 7 dias: Lista todos tus costos fijos mensuales (renta, nomina, insumos, servicios). Solo hacer la lista ya es un avance.',
        'Semana 2: Clasifica tratamientos por margen bruto real (no solo por precio de venta). El mas vendido no siempre es el mas rentable.',
        'Mes 1: Implementa Contpaq, Alegra o al menos un Google Sheet con estructura definida de ingresos / egresos / margen.',
        'Mes 2-3: Con esos datos, identifica los 3 tratamientos de mayor margen y priorizalos en tu comunicacion con pacientes.',
      ],
      timeline: '30-60 dias para control operativo basico',
      responsible: 'Doctor + Contador (si aplica)',
      category: 'Finanzas',
      impact: 'alto',
      effort: 'medio',
      urgency_level: 2,
      revenue_mxn: 0,
    })
  }

  // INSIGHT: Coordinador de experiencia
  if (responses.team_has_coordinator === 'No') {
    insights.push({
      title: 'No tienes coordinador de experiencia del paciente',
      description:
        "En clinicas esteticas, la experiencia entre 'entro al consultorio' y 'volvio a agendar' la gestiona alguien — o no la gestiona nadie. Cuando el doctor hace tambien de coordinador, el costo de oportunidad es enorme: cada minuto que el doctor dedica a confirmar citas o hacer seguimiento es un tratamiento que no se realizo.",
      action_steps: [
        'Define el perfil: no necesitas un profesional de salud — necesitas alguien con habilidades de atencion al cliente, seguimiento y organizacion.',
        'Responsabilidades del rol: confirmacion de citas, seguimiento post-consulta, coordinacion de agenda, gestion de redes basicas.',
        'Alternativa inmediata si no hay presupuesto: re-asigna estas tareas a tu recepcionista actual con un protocolo escrito.',
        'KPI del rol: tasa de retorno de pacientes, tasa de reagendamiento, NPS basico.',
      ],
      timeline: '30-45 dias para definir rol y contratar o reasignar',
      responsible: 'Doctor (decision) → Asistente actual (implementacion)',
      category: 'Equipo',
      impact: 'alto',
      effort: 'medio',
      urgency_level: 2,
      revenue_mxn: 0,
    })
  }

  // INSIGHT: Canales de adquisicion limitados
  const channels = responses.journey_acquisition
    ? responses.journey_acquisition.split(',').filter(Boolean)
    : []
  const hasInstagram =
    channels.includes('Instagram') &&
    responses.journey_instagram !== 'No'
  if (channels.length <= 2 || !hasInstagram) {
    insights.push({
      title: 'Tus canales de adquisicion son limitados',
      description:
        'Una clinica que depende de un solo canal de adquisicion es vulnerable. Si hoy tus pacientes vienen principalmente por referidos, tienes una base solida de confianza — pero sin canal digital activo, tu crecimiento tiene un techo biologico: solo creces si alguien te recomienda.',
      action_steps: [
        'Instagram es el canal principal de medicina estetica en Mexico — si no tienes cuenta activa, esa es la prioridad numero uno.',
        'Contenido minimo viable: 3 posts por semana (1 educativo, 1 resultado/caso, 1 personal del doctor). No necesitas produccion profesional para empezar.',
        "Google Business Profile actualizado (fotos, horarios, resenas) — es gratis y aparece cuando alguien busca 'medico estetico en [ciudad]'.",
        'En 60 dias evalua cual canal esta trayendo pacientes nuevos y duplica ahi.',
      ],
      timeline: '2 semanas para activar canales basicos',
      responsible: 'Asistente + Doctor para revision de contenido',
      category: 'Journey del Paciente',
      impact: 'medio',
      effort: 'medio',
      urgency_level: 2,
      revenue_mxn: fugas.oportunidadReferidos,
    })
  }

  // ============================================================
  // NIVEL 3 — ESCALAMIENTO
  // ============================================================

  // INSIGHT: Sin sistema de gestion
  if (
    responses.tech_mgmt_software === 'Ninguno' ||
    responses.tech_mgmt_software === 'Excel/Sheets'
  ) {
    insights.push({
      title: 'Tu clinica opera sin sistema de gestion',
      description:
        'Una clinica que crece sin sistema de gestion es como una clinica que guarda los expedientes en cajas. Funciona hasta que deja de funcionar. El techo de crecimiento sin sistema esta tipicamente en los 60-80 pacientes/mes — arriba de eso, la calidad de la experiencia del paciente empieza a caer porque nada esta centralizado.',
      action_steps: [
        'Evalua estas opciones para medicina estetica en Mexico: Doctoralia (agenda + expediente + resenas), Medesk (gestion clinica completa), Crecer Medical (enfocado en clinicas esteticas).',
        'Criterios de decision: integracion con WhatsApp, expediente electronico, reportes de facturacion, facilidad para asistentes no tecnicos.',
        'Implementa primero solo la agenda digital — no trates de migrar todo a la vez.',
        'Capacita a tu equipo con el sistema ANTES de decirle a los pacientes que cambio algo.',
      ],
      timeline: '60-90 dias para seleccion, implementacion y estabilizacion',
      responsible: 'Doctor (decision) + Asistente (implementacion diaria)',
      category: 'Tecnologia',
      impact: 'alto',
      effort: 'alto',
      urgency_level: 3,
      revenue_mxn: 0,
    })
  }

  // INSIGHT: Sin expediente electronico
  if (responses.tech_ehr === 'No') {
    insights.push({
      title: 'No tienes expediente electronico del paciente',
      description:
        'Sin expediente electronico, cada paciente empieza de cero cada vez. El doctor no tiene visibilidad del historial de tratamientos, reacciones o productos usados. Esto limita la capacidad de hacer seguimiento personalizado — que es exactamente lo que diferencia a las clinicas esteticas que retienen vs las que solo captan.',
      action_steps: [
        'Si ya implementaste sistema de gestion, el expediente electronico ya viene incluido — activa ese modulo primero.',
        'Si no, solucion intermedia: Google Forms + Google Sheets como ficha del paciente (nombre, tratamientos, fechas, observaciones, proxima cita).',
        'Campos minimos: datos personales, alergias, historial de tratamientos, fotos before/after, proxima cita recomendada, productos en uso.',
        'La foto antes/despues es tu activo de marketing mas poderoso — si no la tienes sistematizada, perdiste una venta potencial en cada tratamiento.',
      ],
      timeline: '90 dias si va junto con sistema de gestion',
      responsible: 'Doctor (definir estructura) + Asistente (captura diaria)',
      category: 'Tecnologia',
      impact: 'medio',
      effort: 'alto',
      urgency_level: 3,
      revenue_mxn: 0,
    })
  }

  // ============================================================
  // Calculate priority_score + mark top 3 as highlighted
  // ============================================================

  const withPriority = insights.map((ins) => ({
    ...ins,
    priority_score: calcPriority(ins.impact, ins.effort, ins.revenue_mxn),
    is_highlighted: false,
  }))

  // Sort by priority desc, mark top 3 highlighted
  withPriority.sort((a, b) => b.priority_score - a.priority_score)
  withPriority.slice(0, 3).forEach((ins) => {
    ins.is_highlighted = true
  })

  return withPriority
}
