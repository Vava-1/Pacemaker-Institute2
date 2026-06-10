import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive?: boolean }
  variant?: 'teal' | 'amber' | 'red' | 'blue' | 'purple'
  subtitle?: string
  onClick?: () => void
}

const variantStyles = {
  teal: {
    bg: 'bg-teal-50', iconBg: 'bg-teal-600', iconText: 'text-white',
    value: 'text-teal-700', title: 'text-teal-600',
    border: 'border-teal-200', hover: 'hover:border-teal-300 hover:shadow-teal-100',
  },
  amber: {
    bg: 'bg-amber-50', iconBg: 'bg-amber-600', iconText: 'text-white',
    value: 'text-amber-700', title: 'text-amber-600',
    border: 'border-amber-200', hover: 'hover:border-amber-300 hover:shadow-amber-100',
  },
  red: {
    bg: 'bg-red-50', iconBg: 'bg-red-600', iconText: 'text-white',
    value: 'text-red-700', title: 'text-red-600',
    border: 'border-red-200', hover: 'hover:border-red-300 hover:shadow-red-100',
  },
  blue: {
    bg: 'bg-blue-50', iconBg: 'bg-blue-600', iconText: 'text-white',
    value: 'text-blue-700', title: 'text-blue-600',
    border: 'border-blue-200', hover: 'hover:border-blue-300 hover:shadow-blue-100',
  },
  purple: {
    bg: 'bg-purple-50', iconBg: 'bg-purple-600', iconText: 'text-white',
    value: 'text-purple-700', title: 'text-purple-600',
    border: 'border-purple-200', hover: 'hover:border-purple-300 hover:shadow-purple-100',
  },
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'teal', subtitle, onClick }: StatCardProps) {
  const s = variantStyles[variant]

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all',
        s.border, s.hover,
        onClick && 'cursor-pointer',
      )}
    >
      {/* Decorative corner accent */}
      <div className={cn('absolute -right-3 -top-3 h-12 w-12 rounded-full opacity-10', s.iconBg)} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn('text-[11px] font-semibold uppercase tracking-wider', s.title)}>{title}</p>
          <p className={cn('text-2xl font-bold tracking-tight', s.value)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.iconBg)}>
          <Icon className={cn('h-5 w-5', s.iconText)} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
          <div className={cn(
            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
            trend.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
          )}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </div>
          <span className="text-[11px] text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  )
}
