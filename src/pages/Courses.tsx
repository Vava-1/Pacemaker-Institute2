import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Clock, Users, Star, Search, GraduationCap } from 'lucide-react'

const levels = ['all', 'beginner', 'intermediate', 'advanced', 'native']

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const categoryFilter = searchParams.get('category') ?? undefined
  const levelFilter = searchParams.get('level') ?? 'all'

  const { data: categories } = trpc.category.list.useQuery()
  const { data: courses } = trpc.course.list.useQuery({
    categorySlug: categoryFilter,
    level: levelFilter === 'all' ? undefined : levelFilter,
    search: search || undefined,
  })
  const { data: myCourses } = trpc.course.myCourses.useQuery()

  const showMyCourses = searchParams.get('my') === '1'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {showMyCourses ? 'My Courses' : 'Explore Courses'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {showMyCourses ? 'Continue your learning journey' : 'Discover courses across all disciplines'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {!showMyCourses && (
          <Tabs value={levelFilter} onValueChange={v => setSearchParams({ ...Object.fromEntries(searchParams), level: v })}>
            <TabsList>
              {levels.map(l => (
                <TabsTrigger key={l} value={l} className="capitalize">{l}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Category Pills */}
      {!showMyCourses && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={!categoryFilter ? 'default' : 'outline'}
            size="sm"
            onClick={() => { const sp = new URLSearchParams(searchParams); sp.delete('category'); setSearchParams(sp); }}
          >
            All Categories
          </Button>
          {categories?.map(cat => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), category: cat.slug })}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      {/* Course Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(showMyCourses ? myCourses : courses)?.map((course: any) => (
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
                  <Badge variant="outline" className="text-xs">{course.categoryName ?? course.categorySlug ?? 'General'}</Badge>
                  <div className="flex items-center text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="ml-1">{course.rating}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{course.shortDescription}</p>
                {showMyCourses && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{course.progress ?? 0}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${course.progress ?? 0}%` }} />
                    </div>
                  </div>
                )}
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

      {(!courses || courses.length === 0) && !showMyCourses && (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-slate-500">Try adjusting your filters or search query</p>
        </div>
      )}

      {showMyCourses && (!myCourses || myCourses.length === 0) && (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No enrolled courses</h3>
          <Link to="/courses">
            <Button className="mt-4 bg-blue-600 text-white">Browse Courses</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
