import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Video, Calendar, Clock, Users, Play,
  Radio, CheckCircle,
} from 'lucide-react'

const mockClasses = [
  { id: 1, title: 'French Conversation Practice', instructor: 'Marie Dubois', scheduledAt: new Date(Date.now() + 3600000).toISOString(), duration: 60, status: 'live', students: 24, maxStudents: 50, category: 'Languages', thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { id: 2, title: 'TOEFL Speaking Strategies', instructor: 'John Smith', scheduledAt: new Date(Date.now() + 7200000).toISOString(), duration: 90, status: 'scheduled', students: 45, maxStudents: 100, category: 'Exam Prep', thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400' },
  { id: 3, title: 'Automotive Engine Diagnostics', instructor: 'Robert Chen', scheduledAt: new Date(Date.now() + 86400000).toISOString(), duration: 120, status: 'scheduled', students: 18, maxStudents: 30, category: 'Mechanics', thumbnail: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400' },
  { id: 4, title: 'Artisan Bread Masterclass', instructor: 'Sophie Laurent', scheduledAt: new Date(Date.now() + 172800000).toISOString(), duration: 90, status: 'scheduled', students: 32, maxStudents: 40, category: 'Bakery', thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
  { id: 5, title: 'Advanced Hair Coloring', instructor: 'Lisa Park', scheduledAt: new Date(Date.now() - 3600000).toISOString(), duration: 75, status: 'ended', students: 28, maxStudents: 35, category: 'Salon', thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400' },
  { id: 6, title: 'AI for Business Analytics', instructor: 'David Kim', scheduledAt: new Date(Date.now() + 43200000).toISOString(), duration: 60, status: 'scheduled', students: 56, maxStudents: 100, category: 'AI Skills', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400' },
]

export default function LiveClasses() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [tab, setTab] = useState('upcoming')

  const filteredClasses = mockClasses.filter(c => {
    if (tab === 'live') return c.status === 'live'
    if (tab === 'upcoming') return c.status === 'scheduled'
    if (tab === 'past') return c.status === 'ended'
    return true
  })

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live': return <Badge className="bg-red-500 text-white animate-pulse"><Radio className="h-3 w-3 mr-1" /> {t('liveClasses.liveBadge')}</Badge>
      case 'scheduled': return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" /> {t('liveClasses.upcomingBadge')}</Badge>
      case 'ended': return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" /> {t('liveClasses.endedBadge')}</Badge>
      default: return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-950 mb-2">{t('liveClasses.title')}</h1>
        <p className="text-slate-500">{t('liveClasses.description')}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">{t('liveClasses.upcoming')}</TabsTrigger>
          <TabsTrigger value="live">{t('liveClasses.liveNow')}</TabsTrigger>
          <TabsTrigger value="past">{t('liveClasses.past')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map(cls => (
          <Card key={cls.id} className={`overflow-hidden hover:shadow-lg transition-all ${cls.status === 'live' ? 'ring-2 ring-red-500' : ''}`}>
            <div className="relative h-40">
              <img src={cls.thumbnail} alt={cls.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">{getStatusBadge(cls.status)}</div>
              {cls.status === 'live' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                    <Play className="mr-2 h-5 w-5" /> {t('liveClasses.joinNow')}
                  </Button>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <Badge variant="outline" className="mb-2">{cls.category}</Badge>
              <h3 className="font-semibold text-lg mb-1">{cls.title}</h3>
              <p className="text-sm text-slate-500 mb-3">{t('liveClasses.byInstructor')} {cls.instructor}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatTime(cls.scheduledAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.duration} {t('liveClasses.min')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="h-3 w-3" /> {cls.students}/{cls.maxStudents} {t('liveClasses.students')}
                </span>
                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(cls.students / cls.maxStudents) * 100}%` }} />
                </div>
              </div>
              {cls.status === 'scheduled' && user && (
                <Button className="w-full mt-3" variant="outline" size="sm">
                  {t('liveClasses.bookClass')}
                </Button>
              )}
              {cls.status === 'ended' && (
                <Button className="w-full mt-3" variant="outline" size="sm">
                  <Video className="mr-2 h-3 w-3" /> {t('liveClasses.watchRecording')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-16">
          <Video className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('liveClasses.noClasses')}</h3>
          <p className="text-slate-500">{t('liveClasses.checkBack')}</p>
        </div>
      )}
    </div>
  )
}
