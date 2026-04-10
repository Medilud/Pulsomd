'use client'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  const color =
    progress >= 80
      ? '#166534'
      : progress >= 60
      ? '#3f6212'
      : progress >= 40
      ? '#9a6200'
      : progress >= 20
      ? '#9a3412'
      : '#991b1b'

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-bold tracking-tight" style={{ fontSize: size * 0.18, color }}>
          {progress}%
        </p>
        {label && (
          <p
            className="text-muted-foreground leading-tight"
            style={{ fontSize: size * 0.085 }}
          >
            {label}
          </p>
        )}
      </div>
    </div>
  )
}
