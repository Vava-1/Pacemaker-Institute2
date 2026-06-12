import { EmptyState } from '@/admin/components/EmptyState'
import { Award } from 'lucide-react'

export default function Certificates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Certificates</h1>
        <p className="text-xs text-slate-400 mt-0.5">View and manage issued course certificates.</p>
      </div>
      <EmptyState
        icon={Award}
        title="Certificate management coming soon"
        description="Track and manage all certificates issued to students upon course completion."
      />
    </div>
  )
}
