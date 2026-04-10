'use client'

import { Question } from '@/lib/questions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check } from 'lucide-react'

interface QuestionFormProps {
  questions: Question[]
  responses: Record<string, string>
  onChange: (key: string, value: string) => void
}

export default function QuestionForm({ questions, responses, onChange }: QuestionFormProps) {
  return (
    <div className="space-y-7">
      {questions.map((q, idx) => (
        <div key={q.key}>
          {/* Separator between questions */}
          {idx > 0 && <div className="border-t border-border/50 mb-7" />}

          <div className="space-y-2.5">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold leading-snug text-foreground">
                {q.label}
                {q.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {q.placeholder && (q.type === 'text') && (
                <p className="text-xs text-muted-foreground">{q.placeholder}</p>
              )}
            </div>

            {/* ── Text ── */}
            {q.type === 'text' && (
              <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={responses[q.key] || ''}
                onChange={(e) => onChange(q.key, e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            )}

            {/* ── Number ── */}
            {q.type === 'number' && (
              <Input
                type="number"
                min="0"
                placeholder={q.placeholder || '0'}
                value={responses[q.key] || ''}
                onChange={(e) => onChange(q.key, e.target.value)}
                className="h-10 max-w-[200px]"
              />
            )}

            {/* ── Select ── */}
            {q.type === 'select' && q.options && (
              <Select
                value={responses[q.key] || ''}
                onValueChange={(value) => onChange(q.key, value ?? '')}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* ── Multi-select ── */}
            {q.type === 'multi-select' && q.options && (
              <div className="grid gap-2">
                {q.options.map((opt) => {
                  const currentValues = responses[q.key]
                    ? responses[q.key].split(',').filter(Boolean)
                    : []
                  const checked = currentValues.includes(opt)

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const updated = checked
                          ? currentValues.filter((v) => v !== opt)
                          : [...currentValues, opt]
                        onChange(q.key, updated.join(','))
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                        checked
                          ? 'border-foreground/30 bg-muted/60 font-medium'
                          : 'border-border/60 hover:border-border hover:bg-muted/30'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                          checked
                            ? 'bg-foreground border-foreground'
                            : 'border-border/60'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 text-background" />}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
