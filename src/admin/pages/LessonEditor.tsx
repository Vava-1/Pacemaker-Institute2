import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { trpc } from '@/providers/trpc'
import { FileUpload } from '@/admin/components/FileUpload'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

const lessonTypes = ['video', 'text', 'pdf', 'quiz'] as const

export default function LessonEditor() {
  const { courseId, lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = lessonId === 'new'
  const cid = Number(courseId)
  const lid = isNew ? null : Number(lessonId)
  const preSelectedModuleId = searchParams.get('moduleId') ? Number(searchParams.get('moduleId')) : null

  const utils = trpc.useUtils()
  const { data: course } = trpc.admin.getCourse.useQuery({ id: cid })

  const modules: Array<{ id: number; title: string }> = (course as any)?.modules ?? []

  const createLesson = trpc.admin.createLesson.useMutation({
    onSuccess: (result) => {
      utils.admin.getCourse.invalidate({ id: cid })
      toast.success('Lesson created')
      navigate(`/admin/courses/${cid}/lessons/${result.id}`, { replace: true })
    },
    onError: (err) => toast.error(err.message),
  })
  const updateLessonMutation = trpc.admin.updateLesson.useMutation({
    onSuccess: () => { utils.admin.getCourse.invalidate({ id: cid }); toast.success('Lesson saved') },
    onError: (err) => toast.error(err.message),
  })

  const [form, setForm] = useState({
    moduleId: preSelectedModuleId ?? 0,
    title: '',
    description: '',
    type: 'video' as string,
    videoUrl: '',
    contentText: '',
    pdfUrl: '',
    duration: 30,
    isFree: false,
  })

  const { data: existingLesson } = trpc.admin.getLesson.useQuery(
    { id: lid! },
    { enabled: !!lid },
  ) as any

  useEffect(() => {
    if (existingLesson) {
      setForm({
        moduleId: existingLesson.moduleId ?? modules[0]?.id ?? 0,
        title: existingLesson.title ?? '',
        description: existingLesson.description ?? '',
        type: existingLesson.type ?? 'video',
        videoUrl: existingLesson.videoUrl ?? '',
        contentText: existingLesson.contentText ?? '',
        pdfUrl: existingLesson.pdfUrl ?? '',
        duration: existingLesson.duration ?? 30,
        isFree: existingLesson.isFree ?? false,
      })
    }
  }, [existingLesson, modules])

  useEffect(() => {
    if (!form.moduleId && modules.length > 0) {
      setForm(f => ({ ...f, moduleId: preSelectedModuleId ?? modules[0].id }))
    }
  }, [modules, preSelectedModuleId])

  const handleSave = () => {
    if (!form.moduleId) { toast.error('Select a module'); return }
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (isNew) {
      createLesson.mutate({
        moduleId: form.moduleId,
        courseId: cid,
        title: form.title.trim(),
        description: form.description || undefined,
        type: form.type as any,
        videoUrl: form.videoUrl || undefined,
        contentText: form.contentText || undefined,
        pdfUrl: form.pdfUrl || undefined,
        duration: form.duration,
        isFree: form.isFree,
      })
    } else if (lid) {
      const payload: Record<string, any> = { id: lid }
      const fields: Record<string, any> = {
        title: form.title, description: form.description || null, type: form.type,
        videoUrl: form.videoUrl || null, contentText: form.contentText || null,
        pdfUrl: form.pdfUrl || null, duration: form.duration, isFree: form.isFree,
      }
      for (const [key, value] of Object.entries(fields)) {
        if (value !== existingLesson?.[key]) payload[key] = value
      }
      if (Object.keys(payload).length > 1) {
        updateLessonMutation.mutate(payload as any)
      } else {
        toast.success('No changes to save')
      }
    }
  }

  const isSaving = createLesson.isPending || updateLessonMutation.isPending
  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/courses/${cid}/edit`)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              {isNew ? 'New Lesson' : `Edit: ${form.title || 'Loading...'}`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isNew ? 'Add content to a module' : 'Edit lesson content and settings'}
            </p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSaving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Lesson Details</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Introduction to Variables" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputCls} min-h-[80px] resize-y`} placeholder="Brief description..." />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Content</h2>

            {form.type === 'video' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Video</label>
                <FileUpload folder="lessons/videos" accept="video/mp4,video/webm" label="Upload lesson video"
                  value={form.videoUrl} onChange={(url) => setForm(f => ({ ...f, videoUrl: url ?? '' }))} previewType="video" />
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Or paste video URL</label>
                  <input value={form.videoUrl} onChange={(e) => setForm(f => ({ ...f, videoUrl: e.target.value }))} className={inputCls} placeholder="https://res.cloudinary.com/..." />
                </div>
              </div>
            )}

            {form.type === 'text' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                <textarea value={form.contentText} onChange={(e) => setForm(f => ({ ...f, contentText: e.target.value }))}
                  className={`${inputCls} min-h-[300px] resize-y font-mono text-sm`} placeholder="Write your lesson content here (plain text or HTML)..." />
              </div>
            )}

            {form.type === 'pdf' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PDF</label>
                <FileUpload folder="lessons/pdfs" accept="application/pdf" label="Upload lesson PDF"
                  value={form.pdfUrl} onChange={(url) => setForm(f => ({ ...f, pdfUrl: url ?? '' }))} />
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Or paste PDF URL</label>
                  <input value={form.pdfUrl} onChange={(e) => setForm(f => ({ ...f, pdfUrl: e.target.value }))} className={inputCls} placeholder="https://res.cloudinary.com/..." />
                </div>
              </div>
            )}

            {form.type === 'quiz' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Quiz Questions (JSON)</label>
                <textarea value={form.contentText} onChange={(e) => setForm(f => ({ ...f, contentText: e.target.value }))}
                  className={`${inputCls} min-h-[300px] resize-y font-mono text-sm`}
                  placeholder='[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]' />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Settings</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Module</label>
              <select value={form.moduleId} onChange={(e) => setForm(f => ({ ...f, moduleId: Number(e.target.value) }))}
                className={inputCls} disabled={!isNew}>
                {modules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              {!isNew && <p className="text-[10px] text-slate-400 mt-0.5">Module cannot be changed after creation.</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                {lessonTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration (minutes)</label>
              <input type="number" min="0" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.isFree} onChange={(e) => setForm(f => ({ ...f, isFree: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              Free preview
            </label>
          </div>

          <button onClick={() => navigate(`/admin/courses/${cid}/edit`)}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            ← Back to course editor
          </button>
        </div>
      </div>
    </div>
  )
}
