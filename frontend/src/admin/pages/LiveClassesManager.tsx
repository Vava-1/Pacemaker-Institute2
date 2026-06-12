import { EmptyState } from '@/admin/components/EmptyState'
import { Video } from 'lucide-react'

export default function LiveClassesManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Live Classes</h1>
        <p className="text-xs text-slate-400 mt-0.5">Schedule and manage live interactive sessions.</p>
      </div>
      <EmptyState
        icon={Video}
        title="Live classes coming soon"
        description="Schedule live sessions, manage attendance, and record classes for later viewing."
      />
    </div>
  )
}
