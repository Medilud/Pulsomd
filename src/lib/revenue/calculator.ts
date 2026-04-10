// PulsoMD Revenue Calculator — implements spec section 7B exactly

export interface RevenueFugas {
  fugaCancelaciones: number
  fugaUpsell: number
  retornoPotencial: number
  oportunidadReferidos: number
  totalEnRiesgo: number
  hasData: boolean
  ticket: number
  pxMes: number
}

export function calculateRevenueFugas(responses: Record<string, string>): RevenueFugas {
  const ticket = parseFloat(responses.fin_avg_ticket || '0')
  const pxMes = parseFloat(responses.clinic_patients_month || '0')
  const hasData = ticket > 0 && pxMes > 0

  if (!hasData) {
    return {
      fugaCancelaciones: 0,
      fugaUpsell: 0,
      retornoPotencial: 0,
      oportunidadReferidos: 0,
      totalEnRiesgo: 0,
      hasData: false,
      ticket: 0,
      pxMes: 0,
    }
  }

  // FUGA 1: Cancelaciones
  const cancelRateMap: Record<string, number> = {
    'Menos del 10%': 0.08,
    '10-20%': 0.15,
    '20-30%': 0.25,
    'Mas del 30%': 0.35,
  }
  const cancelRate = cancelRateMap[responses.ops_cancellation_rate] ?? 0.15
  const fugaCancelaciones = Math.round(pxMes * cancelRate * ticket)

  // FUGA 2: Upsell no realizado
  const upsellMissed =
    responses.journey_upsell === 'Raramente' || responses.journey_upsell === 'No'
  const fugaUpsell = upsellMissed
    ? Math.round(pxMes * 0.3 * (ticket * 0.4))
    : 0

  // FUGA 3: Pacientes sin reactivar
  const badReturn = responses.journey_return_rate === 'Menos del 20%'
  const noFollowup = responses.journey_followup === 'No'
  const retornoPotencial =
    badReturn || noFollowup ? Math.round(pxMes * 0.2 * ticket) : 0

  // OPORTUNIDAD 4: Referidos no capturados
  const oportunidadReferidos =
    responses.journey_loyalty === 'No'
      ? Math.round(pxMes * 0.1 * ticket)
      : 0

  const totalEnRiesgo =
    fugaCancelaciones + fugaUpsell + retornoPotencial + oportunidadReferidos

  return {
    fugaCancelaciones,
    fugaUpsell,
    retornoPotencial,
    oportunidadReferidos,
    totalEnRiesgo,
    hasData: true,
    ticket,
    pxMes,
  }
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}
