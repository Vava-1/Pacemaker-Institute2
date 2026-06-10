import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, Users, Clock, GraduationCap, Brain, Languages,
  Wrench, Cake, Scissors, ArrowRight, Star,
  TrendingUp, Target, Award, ChevronRight, CheckCircle2,
} from 'lucide-react'

function AnimatedCounter({ value, suffix = '' }: { value: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState('0')
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const num = parseInt(value.replace(/[^0-9]/g, ''))
          if (!isNaN(num)) {
            let current = 0
            const step = Math.max(1, Math.floor(num / 40))
            const timer = setInterval(() => {
              current += step
              if (current >= num) {
                setDisplayed(value)
                clearInterval(timer)
              } else {
                setDisplayed(current + suffix)
              }
            }, 25)
          } else {
            setDisplayed(value)
          }
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, suffix])

  return <div ref={ref} className="text-3xl lg:text-4xl font-extrabold">{displayed}</div>
}

function TypewriterText({ text, gradient = '' }: { text: string; gradient?: string }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    let timer: ReturnType<typeof setInterval>
    const tick = () => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(timer)
        setTimeout(() => {
          i = 0
          setDisplayed('')
          timer = setInterval(tick, 40)
        }, 2000)
      }
    }
    timer = setInterval(tick, 40)
    return () => clearInterval(timer)
  }, [text])

  if (!displayed) return <span className="invisible">{text}</span>
  return <span className={gradient}>{displayed}</span>
}

function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const { data: courses } = trpc.course.list.useQuery({ featured: true })
  const { data: platformStats } = trpc.course.publicStats.useQuery(undefined, { enabled: true })
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!user })
  const { data: leaderboard } = trpc.leaderboard.list.useQuery({ limit: 5 }, { enabled: true })

  const categoryDisplay = [
    { icon: Languages, title: t('categories.languages'), description: t('categories.langDesc'), color: 'from-blue-500 to-cyan-500' },
    { icon: GraduationCap, title: t('categories.testPrep'), description: t('categories.testPrepDesc'), color: 'from-emerald-500 to-teal-500' },
    { icon: Cake, title: t('categories.bakery'), description: t('categories.bakeryDesc'), color: 'from-amber-500 to-orange-500' },
    { icon: Scissors, title: t('categories.salon'), description: t('categories.salonDesc'), color: 'from-pink-500 to-rose-500' },
    { icon: Wrench, title: t('categories.mechanics'), description: t('categories.mechanicsDesc'), color: 'from-slate-600 to-slate-800' },
    { icon: Brain, title: t('categories.aiSkills'), description: t('categories.aiSkillsDesc'), color: 'from-purple-500 to-indigo-500' },
    { icon: Award, title: t('categories.privateCandidates'), description: t('categories.privateCandidatesDesc'), color: 'from-red-500 to-rose-600' },
  ]

  const whyChooseUs = [
    { icon: CheckCircle2, text: t('whyChooseUs.points.0') },
    { icon: CheckCircle2, text: t('whyChooseUs.points.1') },
    { icon: CheckCircle2, text: t('whyChooseUs.points.2') },
    { icon: CheckCircle2, text: t('whyChooseUs.points.3') },
    { icon: CheckCircle2, text: t('whyChooseUs.points.4') },
  ]

  const exercises = [
    { title: 'French Greetings Quiz', points: 10, icon: Languages, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'TOEFL Reading Strategy', points: 20, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'AI in Education Quiz', points: 10, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Engine Basics Quiz', points: 20, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  useEffect(() => {
    const wrapper = document.getElementById('heroImage')
    if (!wrapper) return
    const image = wrapper.querySelector('.hero-image') as HTMLElement | null
    if (!image) return

    const onMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = ((y - centerY) / centerY) * -5
      const rotateY = ((x - centerX) / centerX) * 5
      image.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    }

    const onLeave = () => {
      image.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
    }

    wrapper.addEventListener('mousemove', onMove)
    wrapper.addEventListener('mouseleave', onLeave)
    return () => {
      wrapper.removeEventListener('mousemove', onMove)
      wrapper.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div>
      {/* ───── Hero ───── */}
      <section className="relative bg-brand-950 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-brand-950/80" />
        </div>
        <div className="absolute inset-0 opacity-10 mix-blend-overlay">
          <svg viewBox="0 0 1200 800" className="w-full h-full">
            <defs>
              <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            {[
              { cx: 200, cy: 300 }, { cx: 500, cy: 200 }, { cx: 800, cy: 350 },
              { cx: 300, cy: 500 }, { cx: 600, cy: 600 }, { cx: 900, cy: 500 },
              { cx: 400, cy: 400 }, { cx: 700, cy: 250 }, { cx: 1000, cy: 450 },
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.cx} cy={p.cy} r="4" fill="url(#hero-grad)" className="animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                {[200, 400, 600, 800].map((_, j) => {
                  const target = [{ cx: 200, cy: 300 }, { cx: 500, cy: 200 }, { cx: 800, cy: 350 }, { cx: 300, cy: 500 }, { cx: 600, cy: 600 }, { cx: 900, cy: 500 }, { cx: 400, cy: 400 }, { cx: 700, cy: 250 }, { cx: 1000, cy: 450 }][(i + j + 1) % 9]
                  return (
                    <line
                      key={j}
                      x1={p.cx} y1={p.cy} x2={target.cx} y2={target.cy}
                      stroke="url(#hero-grad)" strokeWidth="0.5"
                      className="animate-pulse"
                      style={{ animationDelay: `${(i + j) * 0.2}s`, opacity: 0.3 }}
                    />
                  )
                })}
              </g>
            ))}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <Badge className="mb-4 md:mb-5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 animate-bounce text-xs md:text-sm">
                {t('hero.badge')}
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-3 md:mb-4 min-h-[2.5em] md:min-h-[3em]">
                <TypewriterText text={t('hero.title')} gradient="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent" />
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 md:mb-8 max-w-xl mt-4 md:mt-6">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Link to={user ? '/courses' : '/register'} className="w-full sm:w-auto">
                  <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white px-6 md:px-8 h-10 md:h-12 text-sm md:text-base w-full sm:w-auto shadow-lg shadow-blue-600/25">
                    {user ? t('hero.startLearning') : t('hero.exploreCourses')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block hero-image-wrapper" id="heroImage">
              <div className="hero-image-glow" />
              <div className="hero-image-glass" />
              <img src="/leftside.webp" alt="" className="hero-image" />
              <div className="mt-4 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400" style={{ fontSize: 'clamp(1.25rem, 2.2vw, 2rem)', letterSpacing: '0.15em' }}>
                Learn. Build. Succeed.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats Counter Bar ───── */}
      <section className="py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-950">{t('impact.title')}</h2>
            <p className="text-sm md:text-base text-slate-500 mt-2">{t('impact.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <div className="group relative bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl border border-green-200 p-5 md:p-6 text-center hover:border-green-300 hover:shadow-md hover:shadow-green-100 transition-all duration-300">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-brand-950">
                {platformStats ? <AnimatedCounter value={String(platformStats.totalStudents)} suffix="+" /> : "—"}
              </div>
              <div className="mt-1 text-slate-500 text-xs md:text-sm">Active Students</div>
            </div>
            <div className="group relative bg-gradient-to-br from-emerald-100 to-green-50 rounded-xl border border-emerald-200 p-5 md:p-6 text-center hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100 transition-all duration-300">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-brand-950">
                {platformStats ? <AnimatedCounter value={String(platformStats.totalInstructors)} /> : "—"}
              </div>
              <div className="mt-1 text-slate-500 text-xs md:text-sm">Expert Instructors</div>
            </div>
            <div className="group relative bg-gradient-to-br from-green-100 to-teal-50 rounded-xl border border-green-200 p-5 md:p-6 text-center hover:border-green-300 hover:shadow-md hover:shadow-green-100 transition-all duration-300">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-brand-950">
                {platformStats ? <AnimatedCounter value={String(platformStats.totalCourses)} suffix="+" /> : "—"}
              </div>
              <div className="mt-1 text-slate-500 text-xs md:text-sm">Available Courses</div>
            </div>
            <div className="group relative bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl border border-emerald-200 p-5 md:p-6 text-center hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100 transition-all duration-300">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-brand-950">
                {platformStats ? <AnimatedCounter value={String(platformStats.completedCourses)} suffix="+" /> : "—"}
              </div>
              <div className="mt-1 text-slate-500 text-xs md:text-sm">Courses Completed</div>
            </div>
            <div className="group relative bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl border border-green-200 p-5 md:p-6 text-center hover:border-green-300 hover:shadow-md hover:shadow-green-100 transition-all duration-300">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-brand-950">
                {platformStats ? `${platformStats.averageRating}` : "—"}
              </div>
              <div className="mt-1 text-slate-500 text-xs md:text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── What You Can Learn ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-950 mb-3">{t('categories.whatYouCanLearn')}</h2>
              <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">Practical skills designed to transform your career and future.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {categoryDisplay.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <Card key={i} className="card-hover border-slate-200/80 group overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${cat.color}`} />
                    <CardContent className="p-4 md:p-6">
                      <div className={`w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-base md:text-lg text-brand-950 mb-1 md:mb-2">{cat.title}</h3>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{cat.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── Why Choose Us ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-950 mb-3">{t('whyChooseUs.title')}</h2>
              <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">We're committed to your success.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
              {whyChooseUs.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/80 card-hover">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-brand-950 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── Featured Courses ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-950">{t('featuredCourses.title')}</h2>
              </div>
              <Link to="/courses">
                <Button variant="outline" className="hidden sm:flex rounded-full">
                  {t('featuredCourses.viewAll')} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses?.slice(0, 6).map((course: any) => (
                <Link key={course.id} to={`/courses/${course.slug}`} className="group">
                  <Card className="card-hover border-slate-200/80 h-full flex flex-col">
                    <div className="relative h-40 md:h-48 overflow-hidden rounded-t-xl bg-slate-100">
                      <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/95 text-slate-800 border-0 shadow-xs capitalize text-xs font-medium rounded-full">{course.level}</Badge>
                      </div>
                      {Number(course.price) === 0 && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-emerald-500 text-white border-0 text-xs font-medium rounded-full">Free</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 md:p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-normal text-slate-500 rounded-full">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName })}</Badge>
                        <div className="flex items-center text-amber-500 text-xs gap-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{course.rating}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-brand-950 mb-1 md:mb-2 line-clamp-2 leading-snug text-sm md:text-base">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h3>
                      <p className="text-xs md:text-sm text-slate-500 mb-3 md:mb-4 line-clamp-2 flex-1 leading-relaxed">{t(`courseDescs.${course.slug}`, { defaultValue: course.shortDescription })}</p>
                      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}m</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.totalStudents}</span>
                        </div>
                        <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-sm">
                          {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/courses">
                <Button variant="outline" className="rounded-full">{t('featuredCourses.viewAll')}</Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── AI Tutor Section ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-elevated">
              <div className="grid lg:grid-cols-2 gap-6 md:gap-8 p-6 md:p-8 lg:p-12 items-center">
                <div className="text-white">
                  <Badge className="mb-3 md:mb-4 bg-white/10 text-blue-200 border-white/20 hover:bg-white/20 rounded-full text-xs md:text-sm">
                    <Brain className="w-3 h-3 mr-1.5" /> {t('aiTutor.badge')}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 leading-tight">{t('aiTutor.title')}</h2>
                  <p className="text-blue-200 mb-6 md:mb-8 text-sm md:text-lg leading-relaxed">
                    {t('aiTutor.description')}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-2 md:gap-y-3 mb-6 md:mb-8">
                    {[
                      'Instant answers to any question',
                      'Personalized learning paths',
                      'Daily adaptive exercises',
                      'Progress insights & tips',
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link to="/ai-tutor" className="block sm:inline">
                    <Button size="lg" className="rounded-full bg-white text-blue-700 hover:bg-blue-50 h-10 md:h-12 px-6 md:px-8 text-sm md:text-base w-full sm:w-auto shadow-lg">
                      <Brain className="mr-2 h-4 w-4" /> {t('aiTutor.cta')}
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white/15 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-white/90 leading-relaxed">
                        Hi! I'm your PI Assistant. I can explain concepts, create practice exercises, or guide you through any course. What would you like help with?
                      </div>
                    </div>
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-white rounded-2xl rounded-br-sm px-4 py-3 text-sm text-slate-700 shadow-sm">
                        Help me understand French verb conjugations
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white/15 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-white/90 leading-relaxed">
                        Great question! French verbs change based on who's doing the action. For regular -er verbs like "parler" (to speak): <span className="font-medium">Je parle, Tu parles, Il/Elle parle, Nous parlons, Vous parlez, Ils/Elles parlent</span>. Let's practice!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── Daily Exercises ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <Badge className="mb-3 md:mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-xs md:text-sm">
                  <Target className="w-3 h-3 mr-1.5" /> {t('exercises.title')}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-950 mb-3 md:mb-4">{t('exercises.title')}</h2>
                <p className="text-sm md:text-lg text-slate-500 mb-6 md:mb-8 leading-relaxed">
                  {t('exercises.description')}
                </p>
                <div className="flex gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{dashboardStats?.exercisesCompleted ?? 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Completed</div>
                  </div>
                  <div className="w-px bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold text-emerald-600">{dashboardStats?.accuracy ?? 0}%</div>
                    <div className="text-xs text-slate-500 mt-1">Accuracy</div>
                  </div>
                  <div className="w-px bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xl md:text-3xl font-bold text-amber-600">{dashboardStats?.totalPoints ?? 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Points</div>
                  </div>
                </div>
                <Link to="/exercises" className="block sm:inline">
                  <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white h-10 md:h-12 px-6 md:px-8 text-sm md:text-base w-full sm:w-auto shadow-lg shadow-blue-600/20">
                    <GraduationCap className="mr-2 h-4 w-4" /> {t('exercises.cta')}
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200/80 card-hover cursor-pointer hover:border-blue-200/80 transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${ex.bg} flex items-center justify-center flex-shrink-0`}>
                      <ex.icon className={`h-5 w-5 ${ex.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-brand-950 text-sm">{ex.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-400">+{ex.points} points</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── Leaderboard ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-950 mb-2">{t('leaderboard.title')}</h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {leaderboard?.slice(0, 5).map((entry: any, i: number) => (
                <div key={entry.id} className={`flex items-center gap-4 p-4 rounded-xl ${
                  i === 0
                    ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/80'
                    : 'bg-white border border-slate-200/80'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{i + 1}</div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {entry.userName?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-brand-950 text-sm truncate">{entry.userName ?? 'Anonymous'}</div>
                    <div className="text-xs text-slate-400">{entry.exercisesCompleted} exercises</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-sm">{entry.totalPoints} pts</div>
                    <div className="text-xs text-slate-400">{entry.studyHours}h studied</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-8">
              <Link to="/leaderboard">
                <Button variant="outline" className="rounded-full text-sm md:text-base h-9 md:h-10">{t('leaderboard.viewAll')} <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ───── Final CTA ───── */}
      <ScrollReveal>
        <section className="py-12 md:py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">{t('finalCta.title')}</h2>
            <p className="text-sm md:text-lg text-blue-200 mb-6 md:mb-8 leading-relaxed">
              {t('finalCta.description')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <Link to={user ? '/courses' : '/register'}>
                <Button size="lg" className="rounded-full bg-white text-blue-700 hover:bg-blue-50 px-8 md:px-10 h-10 md:h-12 text-sm md:text-base w-full sm:w-auto shadow-lg">
                  {t('finalCta.cta')}
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
