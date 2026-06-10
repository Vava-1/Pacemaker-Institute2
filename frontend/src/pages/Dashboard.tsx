import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Target, Zap, Flame, TrendingUp,
  GraduationCap, Award, Brain, BarChart3, ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user })
  const { data: activity } = trpc.dashboard.activity.useQuery(undefined, { enabled: !!user })
  const { data: recommendations } = trpc.dashboard.recommendations.useQuery(undefined, { enabled: !!user })
  const { t } = useTranslation()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full border-slate-200/80">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <Brain className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-950 mb-2">Welcome to Pacemaker Institute</h2>
            <p className="text-slate-500 mb-6 text-sm">Login to access your personalized dashboard, track progress, and get AI-powered recommendations.</p>
            <Link to="/login">
              <Button className="btn-primary">Login to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    { label: 'Enrolled', value: stats?.enrolledCourses ?? 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats?.completedCourses ?? 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Exercises', value: stats?.exercisesCompleted ?? 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Points', value: stats?.totalPoints ?? 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Accuracy', value: `${stats?.accuracy ?? 0}%`, icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Streak', value: `${stats?.currentStreak ?? 0}d`, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Welcome back, {user.name?.split(' ')[0] ?? 'Learner'}!</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {stats?.currentStreak ? `🔥 ${stats.currentStreak} day streak! Keep it up!` : 'Start your learning journey today!'}
          </p>
        </div>
        <Link to="/ai-tutor">
          <Button className="btn-primary">
            <Brain className="mr-2 h-4 w-4" /> Ask PI Assistant
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-slate-200/80">
            <CardContent className="p-3 md:p-5">
              <div className={`w-8 md:w-10 h-8 md:h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2 md:mb-3`}>
                <stat.icon className={`h-4 md:h-5 w-4 md:w-5 ${stat.color}`} />
              </div>
              <div className="text-lg md:text-2xl font-bold text-brand-950">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          <Card className="border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-brand-950">
                <BookOpen className="h-5 w-5 text-blue-600" /> Continue Learning
              </CardTitle>
              <Link to="/courses">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">View All <ChevronRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activity?.recentEnrollments && activity.recentEnrollments.length > 0 ? (
                <div className="space-y-3">
                  {activity.recentEnrollments.slice(0, 3).map((course: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                      <img src={course.thumbnail} alt={course.title} className="w-16 h-12 rounded-lg object-cover bg-slate-100" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-brand-950 truncate">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Progress value={course.progress ?? 0} className="h-1.5 w-24 bg-slate-200 [&>div]:bg-blue-600" />
                          <span className="text-xs text-slate-500">{course.progress ?? 0}%</span>
                        </div>
                      </div>
                      <Link to={`/courses/${course.slug}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8">Continue</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">You haven't enrolled in any courses yet</p>
                  <Link to="/courses">
                    <Button size="sm" className="btn-primary">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Exercises */}
          <Card className="border-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-brand-950">
                <Target className="h-5 w-5 text-emerald-600" /> Today's Exercises
              </CardTitle>
              <Link to="/exercises">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">All Exercises <ChevronRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { title: 'French Greetings', subject: 'Languages', points: 10, done: (stats?.exercisesCompleted ?? 0) > 0 },
                  { title: 'TOEFL Reading', subject: 'Exam Prep', points: 20, done: (stats?.exercisesCompleted ?? 0) > 2 },
                  { title: 'AI in Education', subject: 'AI Skills', points: 10, done: (stats?.exercisesCompleted ?? 0) > 5 },
                  { title: 'Engine Basics', subject: 'Mechanics', points: 20, done: (stats?.exercisesCompleted ?? 0) > 8 },
                ].map((ex, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${ex.done ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50/80 border-slate-200/80'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs font-normal text-slate-500">{ex.subject}</Badge>
                      <span className="text-xs font-medium text-amber-600">+{ex.points} pts</span>
                    </div>
                    <h4 className="font-medium text-sm text-brand-950">{ex.title}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      {ex.done ? (
                        <Badge className="bg-emerald-500 text-white text-xs border-0">Completed</Badge>
                      ) : (
                        <Link to="/exercises"><Button size="sm" variant="outline" className="h-7 text-xs">Start</Button></Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Tutor Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-elevated">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg mb-2">PI Assistant</h3>
              <p className="text-blue-200 text-sm mb-5 leading-relaxed">Get personalized help with your courses, exercises, and learning goals.</p>
              <Link to="/ai-tutor">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 w-full shadow-sm">
                  <Brain className="mr-2 h-4 w-4" /> Chat Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Leaderboard Card */}
          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-brand-950">
                <Trophy className="h-5 w-5 text-amber-500" /> Your Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.globalRank ? (
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-blue-600">#{stats.globalRank}</div>
                  <div className="text-sm text-slate-500 mt-1">Global Ranking</div>
                  <div className="mt-5 flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-brand-950">{stats.totalPoints}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Points</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                      <div className="font-bold text-brand-950">{stats.accuracy}%</div>
                      <div className="text-xs text-slate-500 mt-0.5">Accuracy</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-4">Complete exercises to appear on the leaderboard</p>
                  <Link to="/exercises">
                    <Button size="sm" variant="outline">Start Exercising</Button>
                  </Link>
                </div>
              )}
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-slate-500">View Full Leaderboard</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-brand-950">
                <TrendingUp className="h-5 w-5 text-emerald-600" /> Recommended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recommendations?.slice(0, 4).map((course: any) => (
                  <Link key={course.id} to={`/courses/${course.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <img src={course.thumbnail} alt={course.title} className="w-12 h-9 rounded object-cover bg-slate-100" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-brand-950 truncate">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 capitalize">{course.level}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-amber-500">{course.rating} ★</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
