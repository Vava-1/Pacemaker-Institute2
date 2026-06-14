import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Clock, Users, Star, Search, GraduationCap, Lock, ChevronLeft, Globe, Award, User, Phone, Mail, MessageSquare } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

const levels = ['all', 'beginner', 'intermediate', 'advanced']

const languageInfo: Record<string, { name: string; icon: any; color: string }> = {
  english: { name: 'English', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
  french: { name: 'French', icon: BookOpen, color: 'from-indigo-500 to-purple-500' },
  kiswahili: { name: 'Kiswahili', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
  german: { name: 'German', icon: BookOpen, color: 'from-amber-500 to-orange-500' },
  'language-proficiency': { name: 'Language Proficiency Test Preparation', icon: BookOpen, color: 'from-rose-500 to-pink-500' },
}

const testPrepInfo: Record<string, { name: string; exams: string; description: string; color: string }> = {
  'test-prep-english': {
    name: 'English Test Prep Mentorship',
    exams: 'TOEFL, IELTS, DUOLINGO, SAT, Cambridge (FCE, CAE, CPE)',
    description: 'Get personalized one-on-one mentorship to prepare for English proficiency exams including DUOLINGO, SAT, TOEFL, IELTS, and Cambridge. Work directly with an experienced instructor who will assess your current level, create a custom study plan, and guide you through every step of exam preparation.',
    color: 'from-blue-500 to-cyan-500',
  },
  'test-prep-french': {
    name: 'French Test Prep Mentorship',
    exams: 'DELF (A1-C2), DALF, TEF, TCF (TCF Canada, TCF Québec)',
    description: 'Get personalized one-on-one mentorship to prepare for French proficiency exams including DELF, DALF, TEF, and TCF (TCF Canada, TCF Québec). Work directly with an experienced instructor who will assess your current level, create a custom study plan, and guide you through every step of exam preparation.',
    color: 'from-indigo-500 to-purple-500',
  },
  'test-prep-german': {
    name: 'German Test Prep Mentorship',
    exams: 'Goethe-Zertifikat (B1-C1), TestDaF, TELC',
    description: 'Get personalized one-on-one mentorship to prepare for German proficiency exams. Work directly with an experienced instructor who will assess your current level, create a custom study plan, and guide you through every step of exam preparation.',
    color: 'from-amber-500 to-orange-500',
  },
}

function TestPrepMentorshipPage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { t } = useTranslation()
  const info = testPrepInfo[slug]
  if (!info) return null
  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 mb-6 -ml-2">
        <ChevronLeft className="h-4 w-4 mr-1" /> {t('courses.back')}
      </Button>
      <div className={`h-2 rounded-t-xl bg-gradient-to-r ${info.color}`} />
      <Card className="border-slate-200/80 rounded-t-none">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center`}>
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-brand-950">{info.name}</h2>
              <p className="text-slate-500 text-sm mt-1">{info.exams}</p>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed mb-8">{info.description}</p>
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-brand-950 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> {t('testPrep.whyTitle')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{t('testPrep.customStudyPlan')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{t('testPrep.directFeedback')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{t('testPrep.flexibleScheduling')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{t('testPrep.mockExams')}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{t('testPrep.provenStrategies')}</span>
              </li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="font-semibold text-brand-950 mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" /> {t('testPrep.registerTitle')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {t('testPrep.registerDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="btn-primary flex-1">
                <Mail className="h-4 w-4 mr-2" /> {t('testPrep.sendInquiry')}
              </Button>
              <Button variant="outline" className="border-slate-200/80 flex-1">
                <Phone className="h-4 w-4 mr-2" /> {t('testPrep.callToRegister')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Courses() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const categoryFilter = searchParams.get('category') ?? undefined
  const subcategoryFilter = searchParams.get('subcategory') ?? undefined
  const focusFilter = searchParams.get('focus') ?? undefined
  const levelFilter = searchParams.get('level') ?? 'all'

  const { data: categories } = trpc.category.listParents.useQuery()
  const { data: children } = trpc.category.getChildren.useQuery(
    { parentSlug: categoryFilter ?? '' },
    { enabled: !!categoryFilter },
  )
  const { data: tertiaryChildren } = trpc.category.getChildren.useQuery(
    { parentSlug: subcategoryFilter ?? '' },
    { enabled: subcategoryFilter === 'language-proficiency' && !focusFilter },
  )
  const { data: courses } = trpc.course.list.useQuery({
    categorySlug: subcategoryFilter ?? categoryFilter,
    level: levelFilter === 'all' ? undefined : levelFilter,
    search: search || undefined,
  })
  const { data: myCourses, isLoading: myCoursesLoading } = trpc.course.myCourses.useQuery()

  const showMyCourses = searchParams.get('my') === '1'
  const hasChildren = children && children.length > 0
  const hasTertiary = tertiaryChildren && tertiaryChildren.length > 0
  const isTestPrepMentorship = focusFilter && testPrepInfo[focusFilter]

  const clearCategory = () => {
    const sp = new URLSearchParams(searchParams)
    sp.delete('category')
    sp.delete('subcategory')
    sp.delete('focus')
    setSearchParams(sp)
  }

  const selectCategory = (slug: string) => {
    const sp = new URLSearchParams(searchParams)
    sp.set('category', slug)
    sp.delete('subcategory')
    sp.delete('focus')
    setSearchParams(sp)
  }

  const selectSubcategory = (slug: string) => {
    const sp = new URLSearchParams(searchParams)
    sp.set('subcategory', slug)
    sp.delete('focus')
    setSearchParams(sp)
  }

  const selectFocus = (slug: string) => {
    const sp = new URLSearchParams(searchParams)
    sp.set('focus', slug)
    setSearchParams(sp)
  }

  const goBackFromFocus = () => {
    const sp = new URLSearchParams(searchParams)
    sp.delete('focus')
    setSearchParams(sp)
  }

  const goBackFromSubcategory = () => {
    const sp = new URLSearchParams(searchParams)
    sp.delete('subcategory')
    setSearchParams(sp)
  }

  const renderSubcategoryPicker = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children?.map((child: any) => {
        const info = languageInfo[child.slug]
        const Icon = info?.icon ?? BookOpen
        const isTestPrep = child.slug === 'language-proficiency'
        return (
          <button
            key={child.id}
            onClick={() => selectSubcategory(child.slug)}
            className="text-left group"
          >
            <Card className="card-hover border-slate-200/80 h-full overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${info?.color ?? 'from-blue-500 to-indigo-500'}`} />
              <CardContent className="p-6">
                <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${info?.color ?? 'from-blue-500 to-indigo-500'} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-brand-950 mb-2">{child.name}</h3>
                <p className="text-sm text-slate-500">
                  {isTestPrep
                    ? 'Prepare for language proficiency exams with expert guidance'
                    : `Courses for ${child.name} at beginner, intermediate, and advanced levels`}
                </p>
              </CardContent>
            </Card>
          </button>
        )
      })}
    </div>
  )

  const renderTertiaryPicker = () => (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={goBackFromSubcategory} className="text-slate-500">
          <ChevronLeft className="h-4 w-4 mr-1" /> {t('courses.back')}
        </Button>
        <h2 className="text-xl font-bold text-brand-950">{t('courses.chooseLanguage')}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tertiaryChildren?.map((child: any) => {
          const info = testPrepInfo[child.slug]
          if (!info) return null
          return (
            <button
              key={child.id}
              onClick={() => selectFocus(child.slug)}
              className="text-left group"
            >
              <Card className="card-hover border-slate-200/80 h-full overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${info.color}`} />
                <CardContent className="p-6">
                  <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-brand-950 mb-2">{info.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{info.exams}</p>
                  <p className="text-xs text-slate-400">{t('courses.personalMentorship')}</p>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderLevelSelector = () => {
    const info = languageInfo[subcategoryFilter ?? '']
    if (!info) return null
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={goBackFromSubcategory} className="text-slate-500">
            <ChevronLeft className="h-4 w-4 mr-1" /> {t('courses.back')}
          </Button>
          <h2 className="text-xl font-bold text-brand-950">{info.name}</h2>
        </div>
        <div className="overflow-x-auto">
          <Tabs
            value={levelFilter}
            onValueChange={v => {
              const sp = new URLSearchParams(searchParams)
              sp.set('level', v)
              setSearchParams(sp)
            }}
          >
            <TabsList className="bg-slate-100/80">
              {levels.map(l => (
                <TabsTrigger key={l} value={l} className="capitalize text-xs data-[state=active]:bg-white data-[state=active]:shadow-xs">
                    {l === 'all' ? t('courses.allLevels') : l}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    )
  }

  const renderCourseCard = (course: any) => {
    const needsAuth = !user
    const linkTo = needsAuth ? '/login' : `/courses/${course.slug}`
    return (
      <Link key={course.id} to={linkTo} className="group">
        <Card className="card-hover border-slate-200/80 h-full flex flex-col relative">
          {needsAuth && (
            <div className="absolute inset-0 bg-brand-950/50 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <div className="text-white text-center">
                <Lock className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm font-medium">{t('courses.loginToAccess')}</span>
              </div>
            </div>
          )}
          <div className="relative h-36 md:h-48 overflow-hidden rounded-t-xl bg-slate-100">
            <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/95 text-slate-800 border-0 shadow-xs capitalize text-xs font-medium">{course.level}</Badge>
            </div>
            {Number(course.price) === 0 && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-emerald-500 text-white border-0 text-xs font-medium">{t('courses.free')}</Badge>
              </div>
            )}
          </div>
          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal text-slate-500">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName ?? course.categorySlug ?? 'General' })}</Badge>
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
              <span className="font-bold text-blue-600 text-sm">
                {Number(course.price) === 0 ? t('courses.free') : `${Number(course.price).toLocaleString()} Frw`}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderCourseGrid = () => {
    if (!courses || courses.length === 0) {
      return (
        <div className="text-center py-10 md:py-16">
          <BookOpen className="h-12 md:h-16 w-12 md:w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-950 mb-2">{t('courses.noCoursesFound')}</h3>
          <p className="text-slate-500 text-sm">{t('courses.noCoursesDesc')}</p>
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {courses.map((course: any) => renderCourseCard(course))}
      </div>
    )
  }

  const renderMainContent = () => {
    if (isTestPrepMentorship) {
      return <TestPrepMentorshipPage slug={focusFilter} onBack={goBackFromFocus} />
    }
    if (subcategoryFilter === 'language-proficiency') {
      return hasTertiary ? renderTertiaryPicker() : (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )
    }
    if (subcategoryFilter) {
      return (
        <>
          {renderLevelSelector()}
          {renderCourseGrid()}
        </>
      )
    }
    if (hasChildren) {
      return renderSubcategoryPicker()
    }
    return renderCourseGrid()
  }

  const pageTitle = () => {
    if (showMyCourses) return t('courses.myCourses')
    if (isTestPrepMentorship) return testPrepInfo[focusFilter]?.name ?? t('courses.allCourses')
    if (focusFilter) return t('courses.chooseLanguage')
    if (subcategoryFilter === 'language-proficiency') return t('categories.testPrep')
    if (subcategoryFilter) return languageInfo[subcategoryFilter]?.name ?? t('courses.allCourses')
    if (categoryFilter) return t(`categories.${categoryFilter}`, { defaultValue: categories?.find((c: any) => c.slug === categoryFilter)?.name ?? t('courses.allCourses') })
    return t('courses.allCourses')
  }

  const pageDescription = () => {
    if (showMyCourses) return t('courses.continueLearning')
    if (isTestPrepMentorship) return t('courses.personalMentorship')
    if (focusFilter) return t('courses.selectLanguage')
    if (subcategoryFilter === 'language-proficiency') return t('courses.selectLanguage')
    if (subcategoryFilter) return `Browse ${languageInfo[subcategoryFilter]?.name ?? ''} ${t('courses.allCourses').toLowerCase()}`
    if (categoryFilter) return `Browse ${t(`categories.${categoryFilter}`, { defaultValue: categories?.find((c: any) => c.slug === categoryFilter)?.name ?? '' })} ${t('courses.allCourses').toLowerCase()}`
    return t('courses.discoverAll')
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <BackButton />
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          {categoryFilter && (
            <Button variant="ghost" size="sm" onClick={clearCategory} className="text-slate-500 -ml-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-950 mb-2">{pageTitle()}</h1>
            <p className="text-slate-500">{pageDescription()}</p>
          </div>
        </div>
      </div>

      {/* Search & Level Filters */}
      {!showMyCourses && !subcategoryFilter && !focusFilter && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('courses.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 border-slate-200/80 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Category Pills — show at top levels only */}
      {!showMyCourses && !subcategoryFilter && !focusFilter && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={!categoryFilter ? 'default' : 'outline'}
            size="sm"
            className={!categoryFilter ? 'btn-primary text-xs h-8' : 'text-xs h-8 border-slate-200/80'}
            onClick={clearCategory}
          >
            All
          </Button>
          {categories?.map((cat: any) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.slug ? 'default' : 'outline'}
              size="sm"
              className={categoryFilter === cat.slug ? 'btn-primary text-xs h-8' : 'text-xs h-8 border-slate-200/80'}
              onClick={() => selectCategory(cat.slug)}
            >
              {cat.slug === 'languages' && <Globe className="h-3.5 w-3.5 mr-1.5" />}
              {t(`categories.${cat.slug}`, { defaultValue: cat.name })}
            </Button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {showMyCourses && myCoursesLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : showMyCourses && myCourses && myCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {myCourses.map((course: any) => {
            const linkTo = `/courses/${course.slug}`
            return (
              <Link key={course.id} to={linkTo} className="group">
                <Card className="card-hover border-slate-200/80 h-full flex flex-col">
                  <div className="relative h-36 md:h-48 overflow-hidden rounded-t-xl bg-slate-100">
                    <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
                    <Badge variant="outline" className="text-xs font-normal text-slate-500 mb-2 w-fit">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName })}</Badge>
                    <h3 className="font-semibold text-brand-950 mb-1 md:mb-2 line-clamp-2 leading-snug text-sm md:text-base">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h3>
                    <div className="mb-3 mt-auto">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium text-brand-950">{course.progress ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${course.progress ?? 0}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : showMyCourses ? (
        <div className="text-center py-10 md:py-16">
          <GraduationCap className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-950 mb-2">{t('courses.noEnrolled')}</h3>
          <Link to="/courses">
            <Button className="btn-primary mt-4">{t('courses.browseCourses')}</Button>
          </Link>
        </div>
      ) : (
        renderMainContent()
      )}
    </div>
  )
}