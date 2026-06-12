import { EmptyState } from '@/admin/components/EmptyState'
import { Medal } from 'lucide-react'

export default function Badges() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Badges</h1>
        <p className="text-xs text-slate-400 mt-0.5">Create and manage achievement badges for students.</p>
      </div>
      <EmptyState
        icon={Medal}
        title="Badge management coming soon"
        description="Design badges, set criteria, and award them to students based on achievements."
      />
    </div>
  )
}
