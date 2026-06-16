import { useState } from 'react'
import { trpc } from '@/providers/trpc'
import { DataTable } from '@/admin/components/DataTable'
import { ShieldAlert, History, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'bans' | 'audit'>('bans')
  
  const { data: bans } = trpc.admin.getLeaderboardBans.useQuery()
  const { data: auditLog } = trpc.admin.getPointsAuditLog.useQuery()

  const banColumns = [
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }: any) => <div className="font-medium text-slate-800">{row.original.userName}</div>
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
    },
    {
      accessorKey: 'bannedAt',
      header: 'Date',
      cell: ({ row }: any) => <span>{new Date(row.original.bannedAt).toLocaleDateString()}</span>
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          row.original.isActive ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
        )}>
          {row.original.isActive ? 'Active Ban' : 'Expired/Lifted'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">Lift Ban</button>
      )
    }
  ]

  const auditColumns = [
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }: any) => <div className="font-medium text-slate-800">{row.original.userName}</div>
    },
    {
      accessorKey: 'pointsChanged',
      header: 'Change',
      cell: ({ row }: any) => (
        <span className={cn(
          "font-medium",
          row.original.pointsChanged > 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {row.original.pointsChanged > 0 ? '+' : ''}{row.original.pointsChanged}
        </span>
      )
    },
    {
      accessorKey: 'newTotal',
      header: 'New Total',
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }: any) => <span>{new Date(row.original.createdAt).toLocaleString()}</span>
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leaderboard Integrity</h1>
          <p className="text-sm text-slate-500 mt-1">Manage points, bans, and monitor for abuse</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <ShieldAlert className="w-4 h-4" />
          Ban User
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('bans')}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2", activeTab === 'bans' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          <AlertCircle className="w-4 h-4" /> Active Bans
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2", activeTab === 'audit' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
        >
          <History className="w-4 h-4" /> Points Audit Log
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {activeTab === 'bans' ? (
          <DataTable 
            columns={banColumns} 
            data={bans || []} 
            searchable 
            searchPlaceholder="Search bans by user or reason..." 
          />
        ) : (
          <DataTable 
            columns={auditColumns} 
            data={auditLog || []} 
            searchable 
            searchPlaceholder="Search audit log..." 
          />
        )}
      </div>
    </div>
  )
}
