import { useState } from 'react'
import { useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { toast } from 'sonner'
import {
  Plus, Edit3, Trash2, ChevronDown, ChevronRight,
  BookOpen, Video, FileText, HelpCircle, Loader2, X, Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcons = { video: Video, text: FileText, pdf: FileText, quiz: HelpCircle }
const typeColors = { video: 'text-purple-600 bg-purple-50', text: 'text-blue-600 bg-blue-50', pdf: 'text-red-600 bg-red-50', quiz: 'text-amber-600 bg-amber-50' }

interface Module {
  id: number
  title: string
  description: string | null
  order: number | null
  lessons: Array<{
    id: number
    title: string
    type: string
    order: number | null
    isFree: boolean | null
  }>
}

interface Props {
  courseId: number
}

export function ModuleLessonManager({ courseId }: Props) {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const { data: course, isLoading } = trpc.admin.getCourse.useQuery({ id: courseId })
  const modules: Module[] = (course as any)?.modules ?? []

  const createModule = trpc.admin.createModule.useMutation({
    onSuccess: () => { utils.admin.getCourse.invalidate({ id: courseId }); toast.success('Module created') },
    onError: (err) => toast.error(err.message),
  })
  const updateModule = trpc.admin.updateModule.useMutation({
    onSuccess: () => { utils.admin.getCourse.invalidate({ id: courseId }); toast.success('Module updated') },
    onError: (err) => toast.error(err.message),
  })
  const deleteModule = trpc.admin.deleteModule.useMutation({
    onSuccess: () => { utils.admin.getCourse.invalidate({ id: courseId }); toast.success('Module deleted') },
    onError: (err) => toast.error(err.message),
  })
  const deleteLesson = trpc.admin.deleteLesson.useMutation({
    onSuccess: () => { utils.admin.getCourse.invalidate({ id: courseId }); toast.success('Lesson deleted') },
    onError: (err) => toast.error(err.message),
  })

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [editingModule, setEditingModule] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return
    createModule.mutate({ courseId, title: newModuleTitle.trim() })
    setNewModuleTitle('')
    setCreating(false)
  }

  const handleRenameModule = (id: number) => {
    if (!editTitle.trim()) return
    updateModule.mutate({ id, title: editTitle.trim() })
    setEditingModule(null)
  }

  const handleDeleteModule = (id: number, lessonCount: number) => {
    if (lessonCount > 0 && !confirm(`This module has ${lessonCount} lesson(s). Delete anyway?`)) return
    deleteModule.mutate({ id })
  }

  const handleDeleteLesson = (id: number) => {
    if (!confirm('Delete this lesson?')) return
    deleteLesson.mutate({ id })
  }

  if (isLoading) return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Course Content</h2>
          <p className="text-xs text-slate-400">{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Module
        </button>
      </div>

      {/* Inline create module */}
      {creating && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <input
            autoFocus
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateModule(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Module title..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-teal-400"
          />
          <button onClick={handleCreateModule} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700">
            Create
          </button>
          <button onClick={() => setCreating(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Module list */}
      {modules.length === 0 && !creating && (
        <div className="flex flex-col items-center py-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No modules yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Module" to build your course content.</p>
        </div>
      )}

      <div className="px-5 py-3 space-y-2">
        {modules.map((mod) => (
          <div key={mod.id} className="rounded-lg border border-slate-200 overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5">
              <button onClick={() => toggleExpand(mod.id)} className="text-slate-400 hover:text-slate-600">
                {expanded.has(mod.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {editingModule === mod.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameModule(mod.id); if (e.key === 'Escape') setEditingModule(null) }}
                  className="flex-1 rounded border border-teal-300 px-2 py-1 text-sm outline-none"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-slate-700">{mod.title}</span>
              )}
              {editingModule === mod.id ? (
                <button onClick={() => handleRenameModule(mod.id)} className="p-1 text-teal-600 hover:text-teal-700">
                  <Save className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => { setEditingModule(mod.id); setEditTitle(mod.title) }}
                  className="p-1 text-slate-400 hover:text-blue-600"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDeleteModule(mod.id, mod.lessons.length)}
                className="p-1 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 ml-1">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Lesson list */}
            {expanded.has(mod.id) && (
              <div className="divide-y divide-slate-100">
                {mod.lessons.length === 0 && (
                  <div className="px-10 py-6 text-center text-xs text-slate-400">
                    No lessons yet. Create one below.
                  </div>
                )}
                {mod.lessons.map((lesson) => {
                  const Icon = typeIcons[lesson.type as keyof typeof typeIcons] ?? Video
                  const color = typeColors[lesson.type as keyof typeof typeColors] ?? 'text-slate-600 bg-slate-50'
                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-2 px-10 py-2.5 hover:bg-slate-50 cursor-pointer group"
                      onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                    >
                      <div className={cn('flex h-6 w-6 items-center justify-center rounded', color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 text-sm text-slate-600 group-hover:text-slate-800">{lesson.title}</span>
                      {lesson.isFree && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">Free</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id) }}
                        className="p-1 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
                {/* Add lesson button */}
                <div className="px-10 py-2">
                  <button
                    onClick={() => navigate(`/admin/courses/${courseId}/lessons/new?moduleId=${mod.id}`)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
