import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { StatCard } from '@/admin/components/StatCard'
import { MessageSquare, Brain, Target, Shield, AlertTriangle } from 'lucide-react'


export function AIManagement() {
  const { data: stats } = trpc.admin.getAIUsageStats.useQuery()

  const conversationColumns = [
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }: any) => <div className="font-medium text-slate-800">{row.original.userName}</div>
    },
    {
      accessorKey: 'discipline',
      header: 'Subject Area',
    },
    {
      accessorKey: 'messageCount',
      header: 'Messages',
    },
    {
      accessorKey: 'createdAt',
      header: 'Started At',
      cell: ({ row }: any) => <span>{new Date(row.original.createdAt).toLocaleString()}</span>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">View Transcript</button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Tutor Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor usage, guardrails, and conversation transcripts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Conversations" value={stats?.totalConversations || 0} icon={MessageSquare} variant="teal" subtitle="All time" />
        <StatCard title="Avg Messages/Chat" value={stats?.avgMessages || 0} icon={Brain} variant="blue" subtitle="Engagement depth" />
        <StatCard title="AI Feedback Given" value={stats?.totalFeedback || 0} icon={Target} variant="purple" subtitle="On exercises" />
        <StatCard title="Flagged Content" value="0" icon={AlertTriangle} variant="red" subtitle="Require review" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent AI Conversations</h2>
          <DataTable 
            columns={conversationColumns} 
            data={stats?.recentConversations || []} 
            searchable 
            searchPlaceholder="Search by user or subject..." 
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Guardrails Status
            </h2>
            <p className="text-sm text-slate-500 mb-4">Current safety filters and boundaries active on the AI Tutor.</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Topic Enforcement</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Toxicity Filter</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">STRICT</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">Direct Answers Allowed</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">DENY</span>
              </div>
            </div>
            
            <button className="w-full mt-4 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
              Configure Guardrails
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
