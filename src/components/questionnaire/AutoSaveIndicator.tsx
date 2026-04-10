'use client'

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error'
}

export default function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === 'saving' && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Guardando
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1.5 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          Guardado
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="w-3 h-3" />
          Error al guardar
        </span>
      )}
    </div>
  )
}
