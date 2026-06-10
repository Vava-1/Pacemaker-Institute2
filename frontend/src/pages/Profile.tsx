import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User, Mail, BookOpen, Trophy, Target, Award,
  Clock, Flame, Zap, GraduationCap, Camera, Save,
} from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { useTranslation } from 'react-i18next'

export default function Profile() {
  const { user } = useAuth()
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user })
  const { data: myCourses } = trpc.course.myCourses.useQuery()
  const { t } = useTranslation()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')

  const handleSave = () => {
    toast.success('Profile updated successfully!')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="absolute top-20 left-4">
          <BackButton />
        </div>
        <div className="text-center">
          <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Login to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BackButton />
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 mb-4 gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar ?? ''} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {user.name?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-brand-950">{user.name}</h1>
              <p className="text-slate-500 flex items-center gap-2">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
              {user.role === 'admin' ? 'Administrator' : user.role === 'instructor' ? 'Instructor' : 'Student'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Courses', value: stats?.enrolledCourses ?? 0, icon: BookOpen, color: 'text-blue-500' },
              { label: 'Completed', value: stats?.completedCourses ?? 0, icon: GraduationCap, color: 'text-emerald-500' },
              { label: 'Points', value: stats?.totalPoints ?? 0, icon: Zap, color: 'text-amber-500' },
              { label: 'Streak', value: `${stats?.currentStreak ?? 0}d`, icon: Flame, color: 'text-red-500' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="courses">
            <TabsList className="w-full">
              <TabsTrigger value="courses" className="flex-1">My Courses</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-4">
              {myCourses && myCourses.length > 0 ? (
                <div className="space-y-3">
                  {myCourses.map((course: any) => (
                    <Card key={course.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <img src={course.thumbnail} alt={course.title} className="w-16 h-12 rounded-lg object-cover" />
                        <div className="flex-1">
                          <h4 className="font-medium">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName })}</Badge>
                            {course.isCompleted && <Badge className="bg-emerald-500 text-white text-xs">Completed</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{course.progress ?? 0}%</div>
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${course.progress ?? 0}%` }} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>No enrolled courses yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
                  </div>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Target className="h-4 w-4" /> Exercises</span>
                <span className="font-medium">{stats?.exercisesCompleted ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Trophy className="h-4 w-4" /> Accuracy</span>
                <span className="font-medium">{stats?.accuracy ?? 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Study Time</span>
                <span className="font-medium">{stats?.totalStudyMinutes ?? 0} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Award className="h-4 w-4" /> Certificates</span>
                <span className="font-medium">{stats?.certificates ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Zap, label: 'First Steps', color: 'text-blue-500', bg: 'bg-blue-100' },
                  { icon: Flame, label: '7-Day Streak', color: 'text-orange-500', bg: 'bg-orange-100' },
                  { icon: Trophy, label: 'Top 10', color: 'text-amber-500', bg: 'bg-amber-100' },
                  { icon: Target, label: '50 Exercises', color: 'text-emerald-500', bg: 'bg-emerald-100' },
                  { icon: Award, label: 'Course Pro', color: 'text-purple-500', bg: 'bg-purple-100' },
                  { icon: BookOpen, label: 'Bookworm', color: 'text-pink-500', bg: 'bg-pink-100' },
                ].map((badge, i) => (
                  <div key={i} className="text-center p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 mx-auto mb-1 rounded-lg ${badge.bg} flex items-center justify-center`}>
                      <badge.icon className={`h-5 w-5 ${badge.color}`} />
                    </div>
                    <div className="text-[10px] font-medium">{badge.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
