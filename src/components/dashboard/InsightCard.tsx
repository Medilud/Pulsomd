'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, UserRound } from 'lucide-react'
import { Insight } from '@/lib/insights/generator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface InsightCardProps {
  insight: Insight & { id?: string }
  compact?: boolean
}

const impactBorder = {
  alto: 'border-l-rose-700',
  medio: 'border-l-amber-600',
  bajo: 'border-l-emerald-700',
}

const impactBadge = {
  alto: 'bg-rose-50 text-rose-800 border-rose-200',
  medio: 'bg-amber-50 text-amber-800 border-amber-200',
  bajo: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

const effortBadge = {
  bajo: 'bg-slate-50 text-slate-700 border-slate-200',
  medio: 'bg-slate-50 text-slate-600 border-slate-200',
  alto: 'bg-slate-50 text-slate-500 border-slate-200',
}

const urgencyLabel: Record<number, string> = {
  1: 'Accion inmediata',
  2: 'Optimizacion',
  3: 'Escalamiento',
}

const urgencyBadge: Record<number, string> = {
  1: 'bg-rose-50 text-rose-700 border-rose-200',
  2: 'bg-sky-50 text-sky-700 border-sky-200',
  3: 'bg-violet-50 text-violet-700 border-violet-200',
}

export default function InsightCard({ insight, compact = false }: InsightCardProps) {
  const [expanded, setExpanded] = useState(!compact)

  const steps: string[] =
    typeof insight.action_steps === 'string'
      ? JSON.parse(insight.action_steps)
      : insight.action_steps || []

  return (
    <Card
      className={`border-l-[3px] ${impactBorder[insight.impact]} shadow-none rounded-lg overflow-hidden`}
    >
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="space-y-2.5">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium tracking-wide px-2 py-0.5 ${impactBadge[insight.impact]}`}
            >
              Impacto {insight.impact}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] font-medium tracking-wide px-2 py-0.5 ${effortBadge[insight.effort]}`}
            >
              Esfuerzo {insight.effort}
            </Badge>
            {insight.urgency_level && (
              <Badge
                variant="outline"
                className={`text-[10px] font-medium tracking-wide px-2 py-0.5 ${urgencyBadge[insight.urgency_level]}`}
              >
                {urgencyLabel[insight.urgency_level]}
              </Badge>
            )}
          </div>

          {/* Title */}
          <p className="font-semibold text-sm leading-snug text-foreground">
            {insight.title}
          </p>

          {/* Revenue pill */}
          {insight.revenue_mxn > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-[var(--gold-muted)] border border-[var(--gold-light)] rounded-full px-3 py-1">
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--gold)' }}
              >
                Hasta{' '}
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  maximumFractionDigits: 0,
                }).format(insight.revenue_mxn)}
                /mes
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4">
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {insight.description}
        </p>

        {compact && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Ver pasos de accion
          </button>
        )}

        {expanded && (
          <div className="space-y-4 mt-1">
            {steps.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Pasos de accion
                </p>
                <ol className="space-y-2">
                  {steps.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                        style={{
                          background: 'var(--gold-muted)',
                          color: 'var(--gold)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
              {insight.timeline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {insight.timeline}
                </span>
              )}
              {insight.responsible && (
                <span className="flex items-center gap-1.5">
                  <UserRound className="w-3 h-3" />
                  {insight.responsible}
                </span>
              )}
            </div>

            {compact && (
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Ocultar
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
