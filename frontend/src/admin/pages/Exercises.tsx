import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { Edit2, CheckCircle, XCircle, Brain, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Exercises() {
  const [activeTab, setActiveTab] = useState<'review' | 'live' | 'config'>('review')
  
  // Queries
  const { data: exercises, refetch: refetchExercises } = trpc.admin.getGeneratedExercises.useQuery({}, {
    enabled: activeTab === 'review' || activeTab === 'live'
  })
  const { data: config } = trpc.admin.getExerciseConfig.useQuery(undefined, {
    enabled: activeTab === 'config'
  })

  // Mutations
  const updateStatus = trpc.admin.updateExerciseReviewStatus.useMutation({
    onSuccess: () => refetchExercises()
  })

  const handleApprove = (id: number) => {
    updateStatus.mutate({ exerciseId: id, status: 'approved' })
  }

  const handleReject = (id: number) => {
    updateStatus.mutate({ exerciseId: id, status: 'rejected', rejectionReason: 'Manually rejected by admin' })
  }

  const columns = [
    {
      accessorKey: 'title',
      header: 'Question Title',
      cell: ({ row }: any) => (
        <div className="font-medium text-slate-800">{row.original.title}</div>
      )
    },
    {
      accessorKey: 'courseName',
      header: 'Course',
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }: any) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          row.original.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
          row.original.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        )}>
          {row.original.difficulty}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          row.original.status === 'approved' || row.original.status === 'live' ? 'bg-green-100 text-green-700' :
          row.original.status === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        )}>
          {row.original.status || 'pending'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          {(!row.original.status || row.original.status === 'pending') && (
            <>
              <button 
                onClick={() => handleApprove(row.original.id)}
                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Approve">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleReject(row.original.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Reject">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const reviewData = exercises?.filter((e: any) => !e.status || e.status === 'pending' || e.status === 'rejected') || []
  const liveData = exercises?.filter((e: any) => e.status === 'approved' || e.status === 'live') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exercise Management</h1>
          <p className="text-sm text-slate-500 mt-1">Review AI-generated content and configure parameters</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Generate New
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('review')}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'review' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          Pending Review
        </button>
        <button 
          onClick={() => setActiveTab('live')}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", activeTab === 'live' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          Live Bank
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2", activeTab === 'config' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          <Brain className="w-4 h-4" /> Config
        </button>
      </div>

      {activeTab === 'review' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <DataTable 
            columns={columns} 
            data={reviewData} 
            searchable 
            searchPlaceholder="Search pending exercises..." 
          />
        </div>
      )}

      {activeTab === 'live' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <DataTable 
            columns={columns} 
            data={liveData} 
            searchable 
            searchPlaceholder="Search live exercises..." 
          />
        </div>
      )}

      {activeTab === 'config' && config && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Generation Parameters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">AI Model</label>
              <select className="w-full border border-slate-300 rounded-md p-2 text-sm">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Questions Per Course</label>
              <input type="number" defaultValue={config[0]?.questionsPerCourse || 3} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Easy %</label>
                <input type="number" defaultValue={config[0]?.easyPercent || 30} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Medium %</label>
                <input type="number" defaultValue={config[0]?.mediumPercent || 50} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hard %</label>
                <input type="number" defaultValue={config[0]?.hardPercent || 20} className="w-full border border-slate-300 rounded-md p-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prompt Template</label>
              <textarea defaultValue={config[0]?.promptTemplate || ''} rows={4} className="w-full border border-slate-300 rounded-md p-2 text-sm font-mono"></textarea>
            </div>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
