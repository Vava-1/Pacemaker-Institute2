import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/providers/trpc'
import { BookOpen, Clock, Star, ArrowRight } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

export default function Subscription() {
  const { t } = useTranslation()
  const { data: courses } = trpc.course.list.useQuery()

  const byCategory: Record<string, any[]> = {}
  courses?.forEach((c: any) => {
    const cat = c.categoryName || 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(c)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackButton />
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-brand-950 mb-2">Course Pricing</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Each course is priced individually in Rwandan Francs (Frw). Minimum 120,000 Frw per course — 
          prices reflect the depth, duration, and real-world value of the skills you will master.
        </p>
      </div>

      {Object.entries(byCategory).map(([category, catCourses]) => (
        <div key={category} className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" /> {category}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catCourses.map((course: any) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold line-clamp-2">
                        {t(`courseTitles.${course.slug}`, { defaultValue: course.title })}
                      </CardTitle>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration} min</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {course.rating}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">{course.level}</Badge>
                  </div>
                  <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-xl font-bold text-slate-900">
                        {Number(course.price).toLocaleString()} Frw
                      </span>
                      {course.originalPrice && Number(course.originalPrice) > Number(course.price) && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          {Number(course.originalPrice).toLocaleString()} Frw
                        </span>
                      )}
                    </div>
                    <Link to={`/courses/${course.slug}`}>
                      <span className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Why per-course pricing?</h3>
        <p className="text-sm text-slate-600">
          We believe in paying only for what you need. Each course is crafted by industry experts 
          with hours of video content, interactive exercises, and real-world projects. 
          Prices are set in Rwandan Francs starting at 120,000 Frw — making quality education 
          accessible and transparent. No recurring fees, no hidden charges.
        </p>
      </div>
    </div>
  )
}
