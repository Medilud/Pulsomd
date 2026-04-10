// PulsoMD Scoring Engine — implements spec section 7A exactly

export interface ScoreResult {
  operaciones: number
  finanzas: number
  equipo: number
  journey: number
  tecnologia: number
  global: number
  label: string
  color: string
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val))
}

export function scoreOperaciones(r: Record<string, string>): number {
  let pts = 0

  // ops_scheduling
  if (r.ops_scheduling === 'App/Sistema') pts += 20
  else if (r.ops_scheduling === 'WhatsApp') pts += 10

  // ops_confirmation
  if (r.ops_confirmation === 'Si automatico') pts += 20
  else if (r.ops_confirmation === 'Si manual') pts += 10

  // ops_cancellation_rate
  if (r.ops_cancellation_rate === 'Menos del 10%') pts += 30
  else if (r.ops_cancellation_rate === '10-20%') pts += 20
  else if (r.ops_cancellation_rate === '20-30%') pts += 10

  // ops_reception_staff
  if (r.ops_reception_staff === 'Si, tiempo completo') pts += 15
  else if (r.ops_reception_staff === 'Si, tiempo parcial') pts += 8

  // ops_bottleneck (free text — +15 for completing)
  if (r.ops_bottleneck && r.ops_bottleneck.trim().length > 0) pts += 15

  return clamp(pts)
}

export function scoreFinanzas(r: Record<string, string>): number {
  let pts = 0

  // fin_accounting
  if (r.fin_accounting === 'Software (SAP, Contpaq, etc)') pts += 30
  else if (r.fin_accounting === 'Contador externo') pts += 20
  else if (r.fin_accounting === 'Hoja de calculo') pts += 10

  // fin_fixed_costs
  if (r.fin_fixed_costs === 'Si, exactamente') pts += 25
  else if (r.fin_fixed_costs === 'Aproximadamente') pts += 10

  // fin_growth_vs_last_year
  if (r.fin_growth_vs_last_year === 'Crecio mas del 20%') pts += 25
  else if (r.fin_growth_vs_last_year === 'Crecio entre 5-20%') pts += 15
  else if (r.fin_growth_vs_last_year === 'Se mantuvo igual') pts += 10

  // fin_payment_methods (multi-select stored as comma-separated)
  const methods = r.fin_payment_methods
    ? r.fin_payment_methods.split(',').filter(Boolean)
    : []
  if (methods.length >= 3) pts += 20
  else if (methods.length === 2) pts += 10

  return clamp(pts)
}

export function scoreEquipo(r: Record<string, string>): number {
  let pts = 0

  if (r.team_has_coordinator === 'Si') pts += 35
  if (r.team_has_nurse === 'Si') pts += 25

  if (r.team_has_marketing === 'Si, interno') pts += 25
  else if (r.team_has_marketing === 'Si, externo (agencia)') pts += 20

  if (r.team_training === 'Capacitaciones formales') pts += 15
  else if (r.team_training === 'On the job') pts += 8

  return clamp(pts)
}

export function scoreJourney(r: Record<string, string>): number {
  let pts = 0

  if (r.journey_followup === 'Si, automatizado') pts += 30
  else if (r.journey_followup === 'Si, manual') pts += 15

  if (r.journey_upsell === 'Siempre') pts += 25
  else if (r.journey_upsell === 'A veces') pts += 12

  if (r.journey_return_rate === 'Mas del 60%') pts += 25
  else if (r.journey_return_rate === '40-60%') pts += 15
  else if (r.journey_return_rate === '20-40%') pts += 5

  if (r.journey_loyalty === 'Si') pts += 10
  else if (r.journey_loyalty === 'En proceso') pts += 5

  if (r.journey_reviews === 'Si, activamente') pts += 10
  else if (r.journey_reviews === 'A veces') pts += 5

  return clamp(pts)
}

export function scoreTecnologia(r: Record<string, string>): number {
  let pts = 0

  if (r.tech_mgmt_software === 'Software especializado (especificar)' || r.tech_mgmt_software === 'App propia') pts += 35
  else if (r.tech_mgmt_software === 'Excel/Sheets') pts += 15

  if (r.tech_ehr === 'Si') pts += 25
  else if (r.tech_ehr === 'En proceso') pts += 10

  if (r.tech_website === 'Si, actualizado') pts += 20
  else if (r.tech_website === 'Si, desactualizado') pts += 8

  if (r.tech_payment_system === 'Terminal bancaria' || r.tech_payment_system === 'App (Clip, etc)') pts += 10
  // both counts as double coverage bonus handled above — just add 10 for any electronic

  return clamp(pts)
}

export function calculateScores(responses: Record<string, string>): ScoreResult {
  const operaciones = scoreOperaciones(responses)
  const finanzas = scoreFinanzas(responses)
  const equipo = scoreEquipo(responses)
  const journey = scoreJourney(responses)
  const tecnologia = scoreTecnologia(responses)

  // Weighted global score per spec
  const global = clamp(
    Math.round(
      finanzas * 0.30 +
      journey * 0.25 +
      operaciones * 0.20 +
      equipo * 0.15 +
      tecnologia * 0.10
    )
  )

  let label: string
  let color: string
  if (global >= 80) {
    label = 'CLINICA ESCALABLE'
    color = '#166534'
  } else if (global >= 60) {
    label = 'EN CRECIMIENTO'
    color = '#3f6212'
  } else if (global >= 40) {
    label = 'CON POTENCIAL'
    color = '#9a6200'
  } else if (global >= 20) {
    label = 'REQUIERE ATENCION'
    color = '#9a3412'
  } else {
    label = 'PUNTO DE QUIEBRE'
    color = '#991b1b'
  }

  return { operaciones, finanzas, equipo, journey, tecnologia, global, label, color }
}
