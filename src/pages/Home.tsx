import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Trophy, Users, Clock, GraduationCap, Brain, Languages,
  Wrench, Cake, Scissors, ArrowRight, Sparkles, Star, Zap,
  TrendingUp, Target, Award,
} from 'lucide-react'

const categoryIcons: Record<string, any> = {
  languages: Languages,
  'exam-prep': GraduationCap,
  mechanics: Wrench,
  bakery: Cake,
  salon: Scissors,
  'ai-skills': Brain,
  'national-exams': Award,
}

const categoryColors: Record<string, string> = {
  languages: 'from-blue-500 to-blue-600',
  'exam-prep': 'from-purple-500 to-purple-600',
  mechanics: 'from-red-500 to-red-600',
  bakery: 'from-orange-500 to-orange-600',
  salon: 'from-pink-500 to-pink-600',
  'ai-skills': 'from-emerald-500 to-emerald-600',
  'national-exams': 'from-amber-500 to-amber-600',
}

export default function Home() {
  const { user } = useAuth()
  const { data: categories } = trpc.category.list.useQuery()
  const { data: courses } = trpc.course.list.useQuery({ featured: true })
  const { data: testimonials } = trpc.testimonial.featured.useQuery()
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user })
  const { data: leaderboard } = trpc.leaderboard.list.useQuery({ limit: 5 }, { enabled: true })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Learning Platform
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
                Your Journey to{' '}
                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Mastery
                </span>{' '}
                Starts Here
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-xl">
                Learn languages, technical skills, and AI tools with personalized AI tutoring, daily exercises, and expert-led courses. Join thousands of successful learners.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={user ? '/courses' : '/login'}>
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-90 text-white px-8">
                    {user ? 'Continue Learning' : 'Get Started Free'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/ai-tutor">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Brain className="mr-2 h-4 w-4" /> Try PI Assistant
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur border-white/10">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold">7+</div>
                  <div className="text-sm text-slate-300">Disciplines</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/10">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold">15K+</div>
                  <div className="text-sm text-slate-300">Students</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/10">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm text-slate-300">Exercises Done</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur border-white/10">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="text-sm text-slate-300">Avg Rating</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Disciplines Section */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Explore Our Disciplines</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From languages to technical skills, we offer comprehensive courses designed to make you job-market ready.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {categories?.map(cat => {
            const Icon = categoryIcons[cat.slug] ?? BookOpen
            const color = categoryColors[cat.slug] ?? 'from-blue-500 to-blue-600'
            return (
              <Link key={cat.id} to={`/courses?category=${cat.slug}`} className="group">
                <Card className="hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{cat.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Courses</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Hand-picked courses from our expert instructors</p>
            </div>
            <Link to="/courses">
              <Button variant="outline">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.slice(0, 6).map(course => (
              <Link key={course.id} to={`/courses/${course.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-slate-900">{course.level}</Badge>
                    </div>
                    {Number(course.price) === 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-emerald-500 text-white">Free</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{course.categoryName}</Badge>
                      <div className="flex items-center text-amber-500 text-xs">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="ml-1">{course.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{course.shortDescription}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}m</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.totalStudents}</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PI Assistant Section */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12 items-center">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-6 w-6" />
                <span className="font-semibold text-blue-200">PI ASSISTANT</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Your Personal AI Tutor</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Get instant help, personalized explanations, and daily practice exercises tailored to your learning goals. Our AI adapts to your level and pace.
              </p>
              <div className="space-y-3 mb-8">
                {['24/7 instant answers', 'Personalized learning paths', 'Daily exercises & challenges', 'Progress tracking & insights'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/ai-tutor">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  <Brain className="mr-2 h-4 w-4" /> Chat with PI Assistant
                </Button>
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-sm text-white">
                    Hi! I'm your PI Assistant. How can I help you today? I can explain concepts, create exercises, or guide you through your courses.
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-white rounded-lg p-3 text-sm text-slate-700">
                    Help me understand French verb conjugations
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white/20 rounded-lg p-3 text-sm text-white">
                    Great question! In French, verbs are conjugated based on the subject. For regular -er verbs like "parler": Je parle, Tu parles, Il/Elle parle, Nous parlons, Vous parlez, Ils/Elles parlent. Let's practice with some exercises!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Exercises CTA */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Target className="w-3 h-3 mr-1" /> Daily Practice
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Daily Exercises to Keep You Sharp</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                Complete daily exercises to maintain your streak, earn points, and climb the leaderboard. Consistency is the key to mastery.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                  <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{dashboardStats?.exercisesCompleted ?? 0}</div>
                  <div className="text-xs text-slate-500">Completed</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                  <Target className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{dashboardStats?.accuracy ?? 0}%</div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl">
                  <Zap className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{dashboardStats?.totalPoints ?? 0}</div>
                  <div className="text-xs text-slate-500">Points</div>
                </div>
              </div>
              <Link to="/exercises">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <GraduationCap className="mr-2 h-4 w-4" /> Start Daily Exercises
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { title: 'French Greetings Quiz', points: 10, difficulty: 'Easy' as const, icon: Languages },
                { title: 'TOEFL Reading Strategy', points: 20, difficulty: 'Medium' as const, icon: BookOpen },
                { title: 'AI in Education', points: 10, difficulty: 'Easy' as const, icon: Brain },
                { title: 'Engine Basics', points: 20, difficulty: 'Medium' as const, icon: Wrench },
              ].map((ex, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ex.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{ex.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ex.difficulty === 'Easy' ? 'Easy' : 'Medium'}
                        </Badge>
                        <span className="text-xs text-slate-500">{ex.points} points</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Top Learners</h2>
          <p className="text-slate-600 dark:text-slate-400">See who's leading the pack this week</p>
        </div>
        <div className="max-w-2xl mx-auto">
          {leaderboard?.slice(0, 5).map((entry, i) => (
            <div key={entry.id} className={`flex items-center gap-4 p-4 mb-3 rounded-xl ${i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200' : 'bg-white dark:bg-slate-800'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {entry.userName?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1">
                <div className="font-medium">{entry.userName ?? 'Anonymous'}</div>
                <div className="text-xs text-slate-500">{entry.exercisesCompleted} exercises</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">{entry.totalPoints} pts</div>
                <div className="text-xs text-slate-500">{entry.studyHours}h studied</div>
              </div>
            </div>
          ))}
          <div className="text-center mt-6">
            <Link to="/leaderboard">
              <Button variant="outline">View Full Leaderboard <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Students Say</h2>
            <p className="text-slate-600 dark:text-slate-400">Real stories from real learners</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials?.slice(0, 6).map(t => (
              <Card key={t.id} className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < (t.rating ?? 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of students already learning on Pacemaker Institute. Your personalized AI tutor, daily exercises, and expert courses are waiting.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={user ? '/courses' : '/login'}>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-500 text-white hover:opacity-90 px-8">
                {user ? 'Browse Courses' : 'Create Free Account'}
                <TrendingUp className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/subscription">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
