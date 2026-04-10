import {
  Building2,
  Settings2,
  TrendingUp,
  Users,
  Route,
  Monitor,
  LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  'building-2': Building2,
  'settings-2': Settings2,
  'trending-up': TrendingUp,
  'users': Users,
  'route': Route,
  'monitor': Monitor,
}

interface SectionIconProps extends LucideProps {
  name: string
}

export default function SectionIcon({ name, ...props }: SectionIconProps) {
  const Icon = iconMap[name] ?? Building2
  return <Icon {...props} />
}
