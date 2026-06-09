import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { trpc } from '@/providers/trpc'
import { FileUpload } from '@/admin/components/FileUpload'
import { ModuleLessonManager } from '@/admin/components/ModuleLessonManager'
import { toast } from 'sonner'
import { ArrowLeft, Save, Eye, Plus, X, Loader2 } from 'lucide-react'

const levels = ['beginner', 'intermediate', 'advanced', 'all_levels'] as const
const languages = ['en', 'fr', 'sw', 'de'] as const
const statuses = ['draft', 'published', 'archived'] as const

export default function CourseEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const courseId = isNew ? null : Number(id)

  const { data: course, isLoading } = trpc.admin.getCourse.useQuery(
    { id: courseId! },
    { enabled: !!courseId },
  )
  const { data: categories = [] } = trpc.admin.getCategories.useQuery()
  const createCourse = trpc.admin.createCourse.useMutation({
    onSuccess: (result) => {
      toast.success('Course created')
      navigate(`/admin/courses/${result.id}/edit`, { replace: true })
    },
    onError: (err) => toast.error(err.message),
  })
  const updateCourse = trpc.admin.updateCourse.useMutation({
    onSuccess: () => toast.success('Course saved'),
    onError: (err) => toast.error(err.message),
  })

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    categoryId: 0,
    level: 'beginner' as string,
    language: 'en' as string,
    price: '0.00',
    originalPrice: '',
    thumbnail: '',
    previewVideo: '',
    isFeatured: false,
    status: 'draft' as string,
    requirements: [''] as string[],
    learningOutcomes: [''] as string[],
    tags: [''] as string[],
  })

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title ?? '',
        slug: course.slug ?? '',
        description: course.description ?? '',
        shortDescription: course.shortDescription ?? '',
        categoryId: course.categoryId ?? 0,
        level: course.level ?? 'beginner',
        language: course.language ?? 'en',
        price: course.price ?? '0.00',
        originalPrice: course.originalPrice ?? '',
        thumbnail: course.thumbnail ?? '',
        previewVideo: course.previewVideo ?? '',
        isFeatured: course.isFeatured ?? false,
        status: course.status ?? 'draft',
        requirements: ((course.requirements as string[])?.length ? course.requirements as string[] : ['']),
        learningOutcomes: ((course.learningOutcomes as string[])?.length ? course.learningOutcomes as string[] : ['']),
        tags: ((course.tags as string[])?.length ? course.tags as string[] : ['']),
      })
    }
  }, [course])

  const handleSave = () => {
    if (isNew) {
      createCourse.mutate({
        title: form.title,
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        categoryId: form.categoryId,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        level: form.level as any,
        language: form.language,
        price: form.price || undefined,
        originalPrice: form.originalPrice || undefined,
        thumbnail: form.thumbnail || undefined,
        previewVideo: form.previewVideo || undefined,
        isFeatured: form.isFeatured,
        requirements: form.requirements.filter(Boolean),
        learningOutcomes: form.learningOutcomes.filter(Boolean),
        tags: form.tags.filter(Boolean),
      })
    } else if (courseId) {
      const payload: Record<string, any> = { id: courseId }
      const fields: Record<string, any> = {
        title: form.title, slug: form.slug, description: form.description,
        shortDescription: form.shortDescription, categoryId: form.categoryId,
        level: form.level, language: form.language, price: form.price,
        originalPrice: form.originalPrice || null, thumbnail: form.thumbnail || null,
        previewVideo: form.previewVideo || null, isFeatured: form.isFeatured,
        status: form.status,
        requirements: form.requirements.filter(Boolean),
        learningOutcomes: form.learningOutcomes.filter(Boolean),
        tags: form.tags.filter(Boolean),
      }
      for (const [key, value] of Object.entries(fields)) {
        if (value !== (course as any)?.[key]) {
          payload[key] = value
        }
      }
      if (Object.keys(payload).length > 1) {
        updateCourse.mutate(payload as any)
      } else {
        toast.success('No changes to save')
      }
    }
  }

  const isSaving = createCourse.isPending || updateCourse.isPending

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/courses')} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {isNew ? 'Create Course' : `Edit: ${course?.title ?? 'Loading...'}`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isNew ? 'Set up a new course with modules and lessons' : 'Manage course content and settings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && course?.status === 'published' && (
            <button
              onClick={() => window.open(`/courses/${course?.slug}`, '_blank')}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" /> View
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Saving...' : 'Save Course'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Basic Information</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Advanced Python Programming" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} placeholder="auto-generated from title" />
              <p className="text-[10px] text-slate-400 mt-0.5">URL-friendly identifier. Leave empty to auto-generate.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Short Description</label>
              <input value={form.shortDescription} onChange={(e) => setForm(f => ({ ...f, shortDescription: e.target.value }))} className={inputCls} placeholder="Brief summary (max 500 chars)" maxLength={500} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} min-h-[100px] resize-y`} placeholder="Detailed course description..." />
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Learning Outcomes</h2>
            <p className="text-xs text-slate-400">What students will learn by taking this course.</p>
            {form.learningOutcomes.map((outcome, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={outcome}
                  onChange={(e) => {
                    const arr = [...form.learningOutcomes]
                    arr[i] = e.target.value
                    setForm(f => ({ ...f, learningOutcomes: arr }))
                  }}
                  className={inputCls} placeholder="e.g. Build REST APIs with Node.js"
                />
                <button
                  type="button"
                  onClick={() => {
                    const arr = form.learningOutcomes.filter((_, idx) => idx !== i)
                    setForm(f => ({ ...f, learningOutcomes: arr.length ? arr : [''] }))
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, learningOutcomes: [...f.learningOutcomes, ''] }))}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add outcome
            </button>
          </div>

          {/* Requirements */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Requirements</h2>
            {form.requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={req}
                  onChange={(e) => {
                    const arr = [...form.requirements]
                    arr[i] = e.target.value
                    setForm(f => ({ ...f, requirements: arr }))
                  }}
                  className={inputCls} placeholder="e.g. Basic JavaScript knowledge"
                />
                <button
                  type="button"
                  onClick={() => {
                    const arr = form.requirements.filter((_, idx) => idx !== i)
                    setForm(f => ({ ...f, requirements: arr.length ? arr : [''] }))
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, requirements: [...f.requirements, ''] }))}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add requirement
            </button>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Tags</h2>
            {form.tags.map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={tag}
                  onChange={(e) => {
                    const arr = [...form.tags]
                    arr[i] = e.target.value
                    setForm(f => ({ ...f, tags: arr }))
                  }}
                  className={inputCls} placeholder="e.g. javascript"
                />
                <button
                  type="button"
                  onClick={() => {
                    const arr = form.tags.filter((_, idx) => idx !== i)
                    setForm(f => ({ ...f, tags: arr.length ? arr : [''] }))
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, tags: [...f.tags, ''] }))}
              className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add tag
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Status & Visibility</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                className={inputCls}
              >
                {statuses.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
                className={inputCls}
              >
                <option value={0}>Select category...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm(f => ({ ...f, level: e.target.value }))}
                className={inputCls}
              >
                {levels.map(l => (
                  <option key={l} value={l}>{l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
              <select
                value={form.language}
                onChange={(e) => setForm(f => ({ ...f, language: e.target.value }))}
                className={inputCls}
              >
                {languages.map(l => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Featured course
            </label>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Pricing</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Price ($)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                className={inputCls} placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Original Price ($)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.originalPrice}
                onChange={(e) => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                className={inputCls} placeholder="Leave empty if no discount"
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Thumbnail</h2>
            <FileUpload
              folder="thumbnails"
              accept="image/jpeg,image/png,image/webp,image/gif"
              label="Upload course thumbnail"
              value={form.thumbnail}
              onChange={(url) => setForm(f => ({ ...f, thumbnail: url ?? '' }))}
              previewType="image"
            />
          </div>

          {/* Preview Video */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Preview Video</h2>
            <FileUpload
              folder="previews"
              accept="video/mp4,video/webm"
              label="Upload preview video"
              value={form.previewVideo}
              onChange={(url) => setForm(f => ({ ...f, previewVideo: url ?? '' }))}
              previewType="video"
            />
          </div>
        </div>
      </div>

      {/* Module & Lesson Manager (only for existing courses) */}
      {!isNew && courseId && (
        <ModuleLessonManager courseId={courseId} />
      )}
    </div>
  )
}
