import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Bell, BookOpen, Target, Award, Video, MessageSquare,
  CheckCircle, Clock,
} from 'lucide-react'
import { BackButton } from '@/components/BackButton'

const typeIcons: Record<string, any> = {
  course: BookOpen,
  exercise: Target,
  badge: Award,
  liveClass: Video,
  message: MessageSquare,
  system: Bell,
}

const typeColors: Record<string, string> = {
  course: 'bg-blue-100 text-blue-600',
  exercise: 'bg-emerald-100 text-emerald-600',
  badge: 'bg-amber-100 text-amber-600',
  liveClass: 'bg-red-100 text-red-600',
  message: 'bg-purple-100 text-purple-600',
  system: 'bg-slate-100 text-slate-600',
}

export default function Notifications() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { data: notifications, isLoading } = trpc.notification.list.useQuery(undefined, { enabled: !!user })
  const utils = trpc.useUtils()
  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  })
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success(t('notifications.markedAllRead'))
      utils.notification.list.invalidate()
    },
  })

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="absolute top-20 left-4">
          <BackButton />
        </div>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('notifications.title')}</h2>
            <p className="text-slate-500 mb-6">{t('notifications.loginPrompt')}</p>
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">{t('notifications.loginBtn')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BackButton />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">{t('notifications.title')}</h1>
          <p className="text-sm text-slate-500">{t('notifications.subtitle')}</p>
        </div>
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCircle className="mr-2 h-4 w-4" /> {t('notifications.markAllRead')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No notifications yet</p>
        </div>
      ) : (
      <div className="space-y-2">
        {notifications.map(notif => {
          const Icon = typeIcons[notif.type] ?? Bell
          const colorClass = typeColors[notif.type] ?? 'bg-slate-100 text-slate-600'
          return (
            <Card key={notif.id} className={!notif.isRead ? 'border-blue-200 bg-blue-50/50' : ''}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-blue-700' : ''}`}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{notif.message}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => markRead.mutate({ id: notif.id })}
                      >
                        {t('notifications.markAsRead')}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}
    </div>
  )
}
