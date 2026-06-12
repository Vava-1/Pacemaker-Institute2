import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Play, CheckCircle, Menu, X, ChevronRight, Lock, Smartphone, CreditCard, Globe, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const PAYMENT_METHODS = [
  { id: 'mtn_mobile_money', label: 'MTN Mobile Money', icon: Smartphone, color: 'bg-yellow-500' },
  { id: 'airtel_money', label: 'Airtel Money', icon: Smartphone, color: 'bg-red-500' },
  { id: 'bank_card', label: 'Bank Card', icon: CreditCard, color: 'bg-blue-600' },
  { id: 'paypal', label: 'PayPal', icon: Globe, color: 'bg-blue-500' },
] as const

export default function LessonPlayer() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const utils = trpc.useUtils()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const lessonIdNum = lessonId ? Number(lessonId) : undefined

  const initiatePayment = trpc.payment.initiatePayment.useMutation({
    onSuccess: (data) => {
      setPaymentInfo(data)
      toast.success('Enrollment created! Follow instructions to complete payment.')
    },
    onError: (err) => toast.error(err.message),
  })

  const confirmPayment = trpc.payment.confirmPayment.useMutation({
    onSuccess: () => {
      setPaymentConfirmed(true)
      toast.success('Payment confirmed! Access granted.')
      utils.lesson.getLessonContent.invalidate({ lessonId: lessonIdNum! })
    },
    onError: (err) => toast.error(err.message),
  })

  // Fetch course info (for sidebar)
  const { data: course, isLoading: isLoadingCourse } = trpc.course.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  )

  // Fetch lesson content
  const { data: lessonContent, isLoading: isLoadingLesson, error: lessonError } = trpc.lesson.getLessonContent.useQuery(
    { lessonId: lessonIdNum! },
    { 
      enabled: !!lessonIdNum,
      retry: false
    }
  )

  const markCompleted = trpc.lesson.markCompleted.useMutation({
    onSuccess: () => {
      toast.success('Lesson marked as completed!')
      // Invalidate queries or refetch progress if necessary
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to mark lesson completed')
    }
  })

  // Finding next lesson logic
  let nextLessonId: number | null = null
  let currentLessonInfo: any = null
  if (course && course.modules) {
    const allLessons = course.modules.flatMap((m: any) => 
      course.lessons?.filter((l: any) => l.moduleId === m.id) || []
    )
    const currentIndex = allLessons.findIndex((l: any) => l.id === lessonIdNum)
    if (currentIndex !== -1) {
      currentLessonInfo = allLessons[currentIndex]
      if (currentIndex < allLessons.length - 1) {
        nextLessonId = allLessons[currentIndex + 1].id
      }
    }
  }

  const handleNextLesson = () => {
    if (nextLessonId) {
      navigate(`/courses/${slug}/lessons/${nextLessonId}`)
    }
  }

  const handleMarkComplete = () => {
    if (lessonIdNum) {
      markCompleted.mutate({ lessonId: lessonIdNum })
    }
  }

  // Handle responsive sidebar on mount/resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    
    // Initial check
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isLoadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse text-slate-400">Loading course...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <h2 className="text-2xl font-bold">Course not found</h2>
        <Link to="/courses">
          <Button variant="outline">Browse Courses</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative z-10 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-sm line-clamp-2">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {course.modules?.map((mod: any, index: number) => (
              <div key={mod.id} className="space-y-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Section {index + 1}: {mod.title}
                </h3>
                <div className="space-y-1">
                  {course.lessons?.filter((l: any) => l.moduleId === mod.id).map((lesson: any, i: number) => {
                    const isActive = lesson.id === lessonId
                    return (
                      <Link 
                        key={lesson.id} 
                        to={`/courses/${slug}/lessons/${lesson.id}`}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors text-sm ${
                          isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {lesson.isFree ? (
                            <Play className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2">{i + 1}. {lesson.title}</p>
                          <p className="text-xs mt-1 opacity-70">{lesson.duration} mins</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Topbar for main content area */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 gap-4 flex-shrink-0">
          {!isSidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to={`/courses/${slug}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ml-auto">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Course</span>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {lessonError && !paymentConfirmed ? (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 mt-8">
                <CardContent className="py-12 px-4">
                  {!showPayment ? (
                    <div className="flex flex-col items-center text-center">
                      <Lock className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-xl font-bold text-amber-900 dark:text-amber-400 mb-2">Lesson Locked</h3>
                      <p className="text-amber-700 dark:text-amber-500 mb-2 max-w-md">
                        Enroll and pay to access this lesson.
                      </p>
                      {course && (
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mb-6">
                          {Number(course.price).toLocaleString()} Frw
                        </p>
                      )}
                      <Button onClick={() => setShowPayment(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                        Pay to Enroll
                      </Button>
                    </div>
                  ) : paymentInfo ? (
                    <div className="max-w-md mx-auto text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Payment Instructions</h3>
                      <p className="text-sm text-slate-500 mb-1">Amount: <strong>{Number(paymentInfo.amount).toLocaleString()} {paymentInfo.currency.toUpperCase()}</strong></p>
                      <p className="text-sm text-slate-500 mb-1">Method: <strong>{paymentInfo.method}</strong></p>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 my-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{paymentInfo.instructions}</p>
                      </div>
                      <Button
                        onClick={() => confirmPayment.mutate({ paymentId: paymentInfo.paymentId })}
                        disabled={confirmPayment.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2"
                      >
                        {confirmPayment.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'I Have Paid — Confirm'}
                      </Button>
                      <p className="text-xs text-slate-400">For mobile money: send the exact amount above to the number shown, then click confirm.</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">Choose Payment Method</h3>
                      <div className="grid gap-3 max-w-sm mx-auto">
                        {PAYMENT_METHODS.map((method) => {
                          const Icon = method.icon
                          const isLoading = initiatePayment.isPending && selectedMethod === method.id
                          return (
                            <button
                              key={method.id}
                              onClick={() => {
                                setSelectedMethod(method.id)
                                initiatePayment.mutate({ courseId: course!.id, paymentMethod: method.id })
                              }}
                              disabled={initiatePayment.isPending}
                              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 hover:shadow-md transition-all disabled:opacity-50"
                            >
                              <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center`}>
                                {isLoading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Icon className="h-5 w-5 text-white" />}
                              </div>
                              <div className="text-left flex-1">
                                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{method.label}</p>
                                <p className="text-xs text-slate-500">
                                  {method.id === 'mtn_mobile_money' || method.id === 'airtel_money' ? 'Pay via mobile money' : method.id === 'bank_card' ? 'Visa / MasterCard' : 'Pay online'}
                                </p>
                              </div>
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : lessonError && paymentConfirmed ? (
              <div className="mt-8 text-center">
                <div className="animate-pulse text-emerald-600">Payment confirmed! Loading lesson...</div>
              </div>
            ) : isLoadingLesson ? (
              <div className="mt-8 space-y-6">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded w-2/3"></div>
              </div>
            ) : lessonContent ? (
              <div className="space-y-8 mt-4">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                  {lessonContent.videoUrl ? (
                    <video 
                      src={lessonContent.videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                      poster={course.thumbnail || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <Play className="h-12 w-12 mb-4 opacity-50" />
                      <p>No video available for this lesson.</p>
                    </div>
                  )}
                </div>

                {/* Lesson Info & Actions */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      {lessonContent.title || currentLessonInfo?.title || 'Lesson Title'}
                    </h1>
                    {lessonContent.description && (
                      <div className="text-slate-600 dark:text-slate-400 prose dark:prose-invert max-w-none">
                        {lessonContent.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                    <Button 
                      variant={markCompleted.isSuccess ? "default" : "outline"}
                      onClick={handleMarkComplete}
                      disabled={markCompleted.isPending}
                      className={`gap-2 ${markCompleted.isSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : ''}`}
                    >
                      <CheckCircle className={`h-4 w-4 ${markCompleted.isSuccess ? 'text-white' : ''}`} />
                      {markCompleted.isPending ? 'Marking...' : markCompleted.isSuccess ? 'Completed' : 'Mark as Complete'}
                    </Button>
                    
                    {nextLessonId && (
                      <Button onClick={handleNextLesson} className="gap-2">
                        Next Lesson
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {lessonContent.contentText && (
                  <Card>
                    <CardContent className="p-6">
                      <div 
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: lessonContent.contentText }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center text-slate-500">
                Lesson content could not be loaded.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
