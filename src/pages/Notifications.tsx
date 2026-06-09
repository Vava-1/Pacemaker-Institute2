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

const mockNotifications = [
  { id: 1, type: 'course', title: 'New course available!', message: 'French Intermediate (B1-B2) is now live. Enroll today!', link: '/courses/french-intermediate-b1-b2', isRead: false, createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 2, type: 'exercise', title: 'Daily exercise completed!', message: 'You earned 10 points. Keep the streak going!', link: '/exercises', isRead: false, createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: 3, type: 'badge', title: 'New badge earned!', message: 'You earned the "First Steps" badge for completing your first exercise.', link: '/profile', isRead: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 4, type: 'liveClass', title: 'Live class starting soon', message: 'French Conversation Practice starts in 1 hour.', link: '/live-classes', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 5, type: 'message', title: 'New message in General', message: 'Alice mentioned you in a conversation.', link: '/chat', isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 6, type: 'system', title: 'Welcome to Pacemaker Institute!', message: 'Complete your profile and start your learning journey.', link: '/profile', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 7, type: 'course', title: 'Course recommendation', message: 'Based on your interests, we recommend "AI for Teachers".', link: '/courses/ai-for-teachers', isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 8, type: 'exercise', title: 'Weekly exercise summary', message: 'You completed 12 exercises this week. Great job!', link: '/exercises', isRead: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
]

export default function Notifications() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const markRead = trpc.notification.markRead.useMutation()
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => toast.success(t('notifications.markedAllRead')),
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">{t('notifications.title')}</h1>
          <p className="text-sm text-slate-500">{t('notifications.subtitle')}</p>
        </div>
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCircle className="mr-2 h-4 w-4" /> {t('notifications.markAllRead')}
        </Button>
      </div>

      <div className="space-y-2">
        {mockNotifications.map(notif => {
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
    </div>
  )
}
