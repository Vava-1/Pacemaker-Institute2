import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function Blog() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const [searchParams] = useSearchParams()
  const activeTag = searchParams.get('tag') || undefined
  const [selectedTag, setSelectedTag] = useState<string | undefined>(activeTag)

  const { data: posts, isLoading } = trpc.blog.list.useQuery({ tag: selectedTag, language: lang })
  const { data: featuredPosts } = trpc.blog.featured.useQuery({ language: lang })

  const allTags = [...new Set<string>((posts ?? []).flatMap((p: any) => p.tags ?? []))].sort()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('blog.title')}</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">{t('blog.subtitle')}</p>
      </div>

      {featuredPosts && featuredPosts.length > 0 && !selectedTag && (
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">{t('blog.featured')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredPosts.slice(0, 2).map((post: any) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <Card className="group border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden h-full">
                  {post.image && (
                    <div className="h-48 overflow-hidden">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Badge
          variant={!selectedTag ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedTag(undefined)}
        >
          {t('blog.allPosts')}
        </Badge>
        {allTags.map((tag: string) => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(tag)}
          >
            <Tag className="h-3 w-3 mr-1" />{tag}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="group border-slate-200/80 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden h-full flex flex-col">
                {post.image && (
                  <div className="h-40 overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1">{post.excerpt}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-blue-600 font-medium mt-4 group-hover:gap-2 transition-all">
                    {t('blog.readMore')} <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p>{t('blog.noPosts')}</p>
        </div>
      )}
    </div>
  )
}
