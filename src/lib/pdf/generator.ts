// PDF generation using @react-pdf/renderer
// This runs server-side only

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { calculateScores } from '../scoring/engine'
import { calculateRevenueFugas, formatMXN } from '../revenue/calculator'
import React from 'react'

// Premium palette
const COLORS = {
  ink:       '#141414',   // warm charcoal
  inkLight:  '#2a2a2a',
  muted:     '#888880',
  mutedLight:'#bbbbb0',
  border:    '#e5e2da',
  bg:        '#faf9f7',   // warm off-white
  gold:      '#c8a84b',
  goldLight: '#e8dfc8',
  goldBg:    '#faf7f0',
  green:     '#166534',
  amber:     '#9a6200',
  red:       '#9a3412',
  white:     '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 44,
    color: COLORS.ink,
    backgroundColor: COLORS.white,
  },
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 44,
    backgroundColor: COLORS.ink,
    color: COLORS.white,
  },
  h1: { fontSize: 28, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  h2: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginBottom: 10, marginTop: 20, color: COLORS.ink },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: COLORS.ink },
  p: { fontSize: 10, lineHeight: 1.65, marginBottom: 6, color: '#444440' },
  small: { fontSize: 8, color: COLORS.muted },
  caption: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1, color: COLORS.muted },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: COLORS.muted, fontSize: 9 },
  value: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  badge: {
    backgroundColor: COLORS.bg,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    fontSize: 8,
    color: COLORS.muted,
  },
  insightCard: {
    border: `1 solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  insightTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: COLORS.ink },
  stepNumber: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.muted, marginRight: 5, width: 12 },
  stepText: { fontSize: 9, color: '#444440', flex: 1, lineHeight: 1.55 },
  divider: { borderBottom: `1 solid ${COLORS.border}`, marginVertical: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  scoreName: { width: 130, fontSize: 9, color: '#444440' },
  scoreBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: 8 },
  scoreBarFill: { height: 5, borderRadius: 3 },
  scoreValue: { width: 28, fontSize: 9, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
})

interface PDFData {
  clinic: {
    name: string
    doctor_name?: string
    specialty?: string
    city?: string
  }
  responses: Record<string, string>
  insights: Array<{
    title: string
    description: string
    action_steps: string | string[]
    timeline?: string
    responsible?: string
    impact: string
    effort: string
    urgency_level: number
    revenue_mxn: number
    is_highlighted: boolean
    category?: string
  }>
}

function getScoreColor(score: number): string {
  if (score >= 70) return COLORS.green
  if (score >= 50) return COLORS.amber
  return COLORS.red
}

export function createPDFDocument(data: PDFData) {
  const { clinic, responses, insights } = data
  const scores = calculateScores(responses)
  const fugas = calculateRevenueFugas(responses)

  const level1 = insights.filter((i) => i.urgency_level === 1)
  const level2 = insights.filter((i) => i.urgency_level === 2)
  const level3 = insights.filter((i) => i.urgency_level === 3)
  const highlighted = insights.filter((i) => i.is_highlighted)

  const scoreItems = [
    { label: 'Finanzas', value: scores.finanzas },
    { label: 'Journey del Paciente', value: scores.journey },
    { label: 'Operaciones', value: scores.operaciones },
    { label: 'Equipo', value: scores.equipo },
    { label: 'Tecnologia', value: scores.tecnologia },
  ]

  const allSections = [
    { title: 'Nivel 1 — Recuperacion Inmediata', insights: level1, subtitle: 'Implementar en los primeros 30 dias' },
    { title: 'Nivel 2 — Optimizacion', insights: level2, subtitle: 'Implementar en los siguientes 30-90 dias' },
    { title: 'Nivel 3 — Escalamiento', insights: level3, subtitle: 'Infraestructura para crecer (90+ dias)' },
  ]

  return React.createElement(
    Document,
    { title: `PulsoMD — ${clinic.name}` },
    // Cover page
    React.createElement(
      Page,
      { size: 'A4', style: styles.coverPage },
      React.createElement(
        View,
        { style: { flex: 1, justifyContent: 'center' } },
        React.createElement(Text, { style: { ...styles.caption, color: COLORS.mutedLight, marginBottom: 10 } }, 'REPORTE DE DIAGN\u00d3STICO'),
        React.createElement(Text, { style: { ...styles.h1, color: COLORS.white } }, 'PulsoMD'),
        React.createElement(View, { style: { backgroundColor: COLORS.inkLight, height: 1, marginVertical: 18 } }),
        React.createElement(Text, { style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.white, marginBottom: 4 } }, clinic.name),
        clinic.doctor_name && React.createElement(Text, { style: { fontSize: 12, color: COLORS.mutedLight } }, clinic.doctor_name),
        clinic.specialty && React.createElement(Text, { style: { fontSize: 10, color: COLORS.muted, marginTop: 4 } }, clinic.specialty),
        React.createElement(View, { style: { marginTop: 36 } },
          React.createElement(Text, { style: { fontSize: 11, color: COLORS.muted, marginBottom: 6, letterSpacing: 0.5 } }, 'Business Health Score'),
          React.createElement(Text, { style: { fontSize: 52, fontFamily: 'Helvetica-Bold', color: scores.color } }, `${scores.global}`),
          React.createElement(Text, { style: { fontSize: 10, color: COLORS.muted, marginBottom: 4 } }, '/100'),
          React.createElement(Text, { style: { fontSize: 14, color: scores.color, marginTop: 4 } }, scores.label),
        ),
      ),
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { fontSize: 9, color: COLORS.muted } }, new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })),
        React.createElement(Text, { style: { fontSize: 9, color: COLORS.muted, marginTop: 2 } }, 'Preparado por Medilud \u00b7 medilud.com.mx'),
      )
    ),

    // Summary page
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.h2 }, 'Resumen Ejecutivo'),

      fugas.hasData && fugas.totalEnRiesgo > 0 && React.createElement(
        View,
        { style: { backgroundColor: COLORS.goldBg, border: `1 solid ${COLORS.goldLight}`, borderRadius: 6, padding: 14, marginBottom: 18 } },
        React.createElement(Text, { style: { ...styles.caption, color: COLORS.gold, marginBottom: 6 } }, 'REVENUE NO CAPTURADO (ESTIMADO)'),
        React.createElement(Text, { style: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: COLORS.gold } }, `${formatMXN(fugas.totalEnRiesgo)}/mes`),
      ),

      React.createElement(Text, { style: styles.h3 }, 'Scores por dimension'),
      ...scoreItems.map((item) =>
        React.createElement(
          View,
          { key: item.label, style: styles.scoreRow },
          React.createElement(Text, { style: styles.scoreName }, item.label),
          React.createElement(
            View,
            { style: styles.scoreBar },
            React.createElement(View, {
              style: {
                ...styles.scoreBarFill,
                width: `${item.value}%`,
                backgroundColor: getScoreColor(item.value),
              },
            })
          ),
          React.createElement(Text, { style: styles.scoreValue }, `${item.value}`)
        )
      ),

      highlighted.length > 0 && React.createElement(
        View,
        null,
        React.createElement(Text, { style: { ...styles.h3, marginTop: 16 } }, 'Top 3 Quick Wins'),
        ...highlighted.map((ins, i) =>
          React.createElement(
            View,
            { key: i, style: { flexDirection: 'row', marginBottom: 6 } },
            React.createElement(Text, { style: { ...styles.stepNumber, fontSize: 10 } }, `${i + 1}.`),
            React.createElement(
              View,
              { style: { flex: 1 } },
              React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold' } }, ins.title),
              ins.revenue_mxn > 0 && React.createElement(
                Text,
                { style: { fontSize: 9, color: COLORS.green } },
                `Hasta ${formatMXN(ins.revenue_mxn)}/mes`
              )
            )
          )
        )
      )
    ),

    // Insights pages
    ...allSections
      .filter((s) => s.insights.length > 0)
      .map((section) =>
        React.createElement(
          Page,
          { key: section.title, size: 'A4', style: styles.page },
          React.createElement(Text, { style: styles.h2 }, section.title),
          React.createElement(Text, { style: { ...styles.small, marginBottom: 12 } }, section.subtitle),
          ...section.insights.map((insight, i) => {
            const steps = typeof insight.action_steps === 'string'
              ? JSON.parse(insight.action_steps)
              : insight.action_steps || []

            return React.createElement(
              View,
              { key: i, style: styles.insightCard, wrap: false },
              React.createElement(
                View,
                { style: { flexDirection: 'row', marginBottom: 4 } },
                React.createElement(Text, { style: { ...styles.badge, color: COLORS.red } }, `Impacto ${insight.impact}`),
                React.createElement(Text, { style: { ...styles.badge, color: COLORS.amber } }, `Esfuerzo ${insight.effort}`),
                insight.revenue_mxn > 0 && React.createElement(Text, { style: { ...styles.badge, color: COLORS.green } }, `${formatMXN(insight.revenue_mxn)}/mes`),
              ),
              React.createElement(Text, { style: styles.insightTitle }, insight.title),
              React.createElement(Text, { style: styles.p }, insight.description),
              steps.length > 0 && React.createElement(
                View,
                null,
                React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 4 } }, 'Pasos de accion:'),
                ...steps.map((step: string, si: number) =>
                  React.createElement(
                    View,
                    { key: si, style: { flexDirection: 'row', marginBottom: 3 } },
                    React.createElement(Text, { style: styles.stepNumber }, `${si + 1}.`),
                    React.createElement(Text, { style: styles.stepText }, step)
                  )
                )
              ),
              React.createElement(
                View,
                { style: { flexDirection: 'row', marginTop: 6 } },
                insight.timeline && React.createElement(Text, { style: { ...styles.small, marginRight: 12 } }, `Timeline: ${insight.timeline}`),
                insight.responsible && React.createElement(Text, { style: styles.small }, `Responsable: ${insight.responsible}`),
              )
            )
          })
        )
      ),

    // Closing page
    React.createElement(
      Page,
      { size: 'A4', style: { ...styles.page, justifyContent: 'center', alignItems: 'center' } },
      React.createElement(Text, { style: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 16 } }, 'Este diagnostico es el primer paso.'),
      React.createElement(Text, { style: { ...styles.p, textAlign: 'center', maxWidth: 360 } }, 'El equipo de Medilud esta listo para ayudarte a ejecutar cada una de estas recomendaciones y convertir tu clinica en un negocio escalable.'),
      React.createElement(View, { style: { marginTop: 24 } },
        React.createElement(Text, { style: { ...styles.h3, textAlign: 'center' } }, 'Contacta a tu asesor de Medilud'),
        React.createElement(Text, { style: { ...styles.small, textAlign: 'center', marginTop: 4 } }, 'medilud.com.mx'),
      )
    )
  )
}
