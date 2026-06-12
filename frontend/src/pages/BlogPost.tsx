import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { format } from 'date-fns'

export default function BlogPost() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: post, isLoading } = trpc.blog.bySlug.useQuery({ slug: slug! }, { enabled: !!slug })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">{t('blog.notFound')}</h1>
        <Button onClick={() => navigate('/blog')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('blog.backToBlog')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/blog')} className="text-slate-500 mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t('blog.backToBlog')}
      </Button>

      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-64 md:h-80 object-cover rounded-xl mb-8"
        />
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {format(new Date(post.createdAt), 'MMM d, yyyy')}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {post.authorName}
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{post.title}</h1>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag: string) => (
            <Link key={tag} to={`/blog?tag=${tag}`}>
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="prose prose-slate max-w-none">
        {post.content.split('\n').map((paragraph: string, i: number) => (
          paragraph.trim() ? <p key={i} className="text-slate-600 leading-relaxed mb-4">{paragraph}</p> : null
        ))}
      </div>
    </div>
  )
}
