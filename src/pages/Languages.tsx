import { useState } from 'react'
import { Link } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Clock, Users, Star, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
]

export default function Languages() {
  const [activeLang, setActiveLang] = useState('en')
  const { data: courses } = trpc.course.list.useQuery()
  const { t } = useTranslation()

  const langData = languages.find(l => l.code === activeLang)
  const filtered = (courses ?? []).filter((c: any) => c.language === activeLang)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-brand-950">Languages</h1>
        </div>
        <p className="text-slate-500">
          Browse courses by language — pick a language to start learning
        </p>
      </div>

      <Tabs value={activeLang} onValueChange={setActiveLang} className="mb-8">
        <TabsList className="bg-slate-100/80 h-auto p-1 gap-1 flex-wrap">
          {languages.map(l => (
            <TabsTrigger
              key={l.code}
              value={l.code}
              className="data-[state=active]:bg-white data-[state=active]:shadow-xs text-sm px-4 py-2 gap-2"
            >
              <span className="text-lg">{l.flag}</span>
              <span>{l.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {langData && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-brand-950 flex items-center gap-2">
            <span>{langData.flag}</span>
            {langData.label} Courses
            <span className="text-sm font-normal text-slate-400 ml-1">({filtered.length})</span>
          </h2>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course: any) => (
          <Link key={course.id} to={`/courses/${course.slug}`} className="group">
            <Card className="card-hover border-slate-200/80 h-full flex flex-col">
              <div className="relative h-48 overflow-hidden rounded-t-xl bg-slate-100">
                <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/95 text-slate-800 border-0 shadow-xs capitalize text-xs font-medium">{course.level}</Badge>
                </div>
                {Number(course.price) === 0 && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-emerald-500 text-white border-0 text-xs font-medium">Free</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-normal text-slate-500">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName })}</Badge>
                  <div className="flex items-center text-amber-500 text-xs gap-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-brand-950 mb-2 line-clamp-2 leading-snug">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1 leading-relaxed">{course.shortDescription}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}m</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.totalStudents}</span>
                  </div>
                  <span className="font-bold text-blue-600 text-sm">
                    {Number(course.price) === 0 ? 'Free' : `$${course.price}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-brand-950 mb-2">No courses yet</h3>
          <p className="text-slate-500 text-sm">
            No {langData?.label} courses available right now. Check back later!
          </p>
        </div>
      )}
    </div>
  )
}
