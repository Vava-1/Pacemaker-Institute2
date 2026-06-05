import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Target, Zap, Flame, TrendingUp,
  GraduationCap, Award, Brain, ArrowRight, BarChart3,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user })
  const { data: activity } = trpc.dashboard.activity.useQuery(undefined, { enabled: !!user })
  const { data: recommendations } = trpc.dashboard.recommendations.useQuery(undefined, { enabled: !!user })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome to Pacemaker Institute</h2>
            <p className="text-slate-500 mb-6">Login to access your personalized dashboard, track progress, and get AI-powered recommendations.</p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white">Login to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    { label: 'Enrolled', value: stats?.enrolledCourses ?? 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Completed', value: stats?.completedCourses ?? 0, icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Exercises', value: stats?.exercisesCompleted ?? 0, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Points', value: stats?.totalPoints ?? 0, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Accuracy', value: `${stats?.accuracy ?? 0}%`, icon: BarChart3, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Streak', value: `${stats?.currentStreak ?? 0} days`, icon: Flame, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name?.split(' ')[0] ?? 'Learner'}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {stats?.currentStreak ? `🔥 ${stats.currentStreak} day streak! Keep it up!` : 'Start your learning journey today!'}
          </p>
        </div>
        <Link to="/ai-tutor">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Brain className="mr-2 h-4 w-4" /> Ask PI Assistant
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" /> Continue Learning
              </CardTitle>
              <Link to="/courses">
                <Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activity?.recentEnrollments && activity.recentEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {activity.recentEnrollments.slice(0, 3).map((course: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <img src={course.thumbnail} alt={course.title} className="w-16 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={course.progress ?? 0} className="h-2 w-24" />
                          <span className="text-xs text-slate-500">{course.progress ?? 0}%</span>
                        </div>
                      </div>
                      <Link to={`/courses/${course.slug}`}>
                        <Button size="sm" variant="outline">Continue</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">You haven't enrolled in any courses yet</p>
                  <Link to="/courses">
                    <Button size="sm" className="bg-blue-600 text-white">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Exercises */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" /> Today's Exercises
              </CardTitle>
              <Link to="/exercises">
                <Button variant="ghost" size="sm">All Exercises <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'French Greetings', subject: 'Languages', points: 10, done: (stats?.exercisesCompleted ?? 0) > 0 },
                  { title: 'TOEFL Reading', subject: 'Exam Prep', points: 20, done: (stats?.exercisesCompleted ?? 0) > 2 },
                  { title: 'AI in Education', subject: 'AI Skills', points: 10, done: (stats?.exercisesCompleted ?? 0) > 5 },
                  { title: 'Engine Basics', subject: 'Mechanics', points: 20, done: (stats?.exercisesCompleted ?? 0) > 8 },
                ].map((ex, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${ex.done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{ex.subject}</Badge>
                      <span className="text-xs font-medium text-amber-600">+{ex.points} pts</span>
                    </div>
                    <h4 className="font-medium text-sm">{ex.title}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      {ex.done ? (
                        <Badge className="bg-emerald-500 text-white text-xs">Completed</Badge>
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
          <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
            <CardContent className="p-6">
              <Brain className="h-8 w-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">PI Assistant</h3>
              <p className="text-blue-100 text-sm mb-4">Get personalized help with your courses, exercises, and learning goals.</p>
              <Link to="/ai-tutor">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 w-full">
                  <Brain className="mr-2 h-4 w-4" /> Chat Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Leaderboard Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Your Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.globalRank ? (
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-blue-600">#{stats.globalRank}</div>
                  <div className="text-sm text-slate-500 mt-1">Global Ranking</div>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                    <div><div className="font-bold">{stats.totalPoints}</div><div className="text-xs text-slate-500">Points</div></div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div><div className="font-bold">{stats.accuracy}%</div><div className="text-xs text-slate-500">Accuracy</div></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 mb-3">Complete exercises to appear on the leaderboard</p>
                  <Link to="/exercises">
                    <Button size="sm" variant="outline">Start Exercising</Button>
                  </Link>
                </div>
              )}
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="w-full mt-2">View Full Leaderboard</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> Recommended
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations?.slice(0, 4).map((course: any) => (
                  <Link key={course.id} to={`/courses/${course.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <img src={course.thumbnail} alt={course.title} className="w-12 h-9 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-5">{course.level}</Badge>
                        <span className="text-xs text-slate-500">{course.rating} ★</span>
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
