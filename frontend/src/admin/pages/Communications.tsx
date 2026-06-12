import { EmptyState } from '@/admin/components/EmptyState'
import { MessageSquare } from 'lucide-react'

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Communications</h1>
        <p className="text-xs text-slate-400 mt-0.5">Send announcements, emails, and manage notifications.</p>
      </div>
      <EmptyState
        icon={MessageSquare}
        title="Communications coming soon"
        description="Send broadcast messages, email campaigns, and manage in-app notifications."
      />
    </div>
  )
}
