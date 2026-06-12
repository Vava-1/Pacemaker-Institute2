import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, BookOpen, FileText, Users, Tags, Star, ArrowRight, Loader2, GraduationCap } from 'lucide-react'
import { BackButton } from '@/components/BackButton'

export default function SearchResults() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [input, setInput] = useState(query)

  const { data, isLoading } = trpc.search.global.useQuery(
    { q: query },
    { enabled: query.length > 0 },
  )

  useEffect(() => {
    setInput(query)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setSearchParams({ q: input.trim() })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <BackButton />

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            {t('common.search') || 'Search'}
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('nav.searchPlaceholder') || 'Search courses, blog posts, instructors...'}
              className="pl-10 h-12 text-base border-slate-200/80 focus-visible:ring-blue-500"
            />
          </form>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && query && data && data.total === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('courses.noCourses') || 'No results found'}</h2>
            <p className="text-slate-500">{t('courses.noCoursesDesc') || 'Try adjusting your search query'}</p>
          </div>
        )}

        {!isLoading && data && data.total > 0 && (
          <div className="space-y-10">
            {data.courses.length > 0 && (
              <Section title={t('nav.courses') || 'Courses'} icon={<BookOpen className="h-5 w-5 text-blue-600" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.courses.map((course: any) => (
                    <Link key={`course-${course.id}`} to={`/courses/${course.slug}`}>
                      <Card className="group hover:shadow-md transition-all border-slate-200/80 h-full">
                        <CardContent className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white overflow-hidden">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                              <GraduationCap className="h-8 w-8" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">{course.title}</h3>
                            {course.shortDescription && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.shortDescription}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              {course.rating && Number(course.rating) > 0 && (
                                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{course.rating}</span>
                              )}
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.totalStudents}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{course.level}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <Link to={`/courses?search=${encodeURIComponent(query)}`} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-3">
                  {t('common.viewAll') || 'View all courses'} <ArrowRight className="h-4 w-4" />
                </Link>
              </Section>
            )}

            {data.blogs.length > 0 && (
              <Section title={t('nav.blog') || 'Blog Posts'} icon={<FileText className="h-5 w-5 text-emerald-600" />}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.blogs.map((blog: any) => (
                    <Link key={`blog-${blog.id}`} to={`/blog/${blog.slug}`}>
                      <Card className="group hover:shadow-md transition-all border-slate-200/80 h-full">
                        <CardContent className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white overflow-hidden">
                            {blog.image ? (
                              <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="h-8 w-8" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{blog.title}</h3>
                            {blog.excerpt && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">{blog.authorName}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {data.instructors.length > 0 && (
              <Section title={t('common.instructors') || 'Instructors'} icon={<Users className="h-5 w-5 text-purple-600" />}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.instructors.map((instructor: any) => (
                    <Card key={`instructor-${instructor.id}`} className="border-slate-200/80">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={instructor.avatar ?? ''} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs">
                            {instructor.name?.charAt(0) ?? 'I'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{instructor.name}</p>
                          <Badge variant="secondary" className="text-[10px] mt-0.5">{instructor.role}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Section>
            )}

            {data.categories.length > 0 && (
              <Section title={t('common.categories') || 'Categories'} icon={<Tags className="h-5 w-5 text-amber-600" />}>
                <div className="flex flex-wrap gap-3">
                  {data.categories.map((cat: any) => (
                    <Link key={`category-${cat.id}`} to={`/courses?category=${cat.slug}`}>
                      <Badge
                        className="px-4 py-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: cat.color ?? '#3b82f6', color: '#fff' }}
                      >
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      {children}
    </section>
  )
}
