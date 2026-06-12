import { EmptyState } from '@/admin/components/EmptyState'
import { FileText } from 'lucide-react'

export default function BlogManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Blog</h1>
        <p className="text-xs text-slate-400 mt-0.5">Create and manage platform blog posts.</p>
      </div>
      <EmptyState
        icon={FileText}
        title="Blog management coming soon"
        description="Write and publish articles, news, and updates for the Pacemaker community."
      />
    </div>
  )
}
