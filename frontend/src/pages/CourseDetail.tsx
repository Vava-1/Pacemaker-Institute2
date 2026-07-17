import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Clock, Users, Star, BookOpen, Play, Award, ArrowLeft, Smartphone, CreditCard, Globe, Loader2, ChevronRight,  } from 'lucide-react'
import { toast } from 'sonner'

const PAYMENT_METHODS = [
  { id: 'mtn_mobile_money', label: 'MTN Mobile Money', icon: Smartphone, color: 'bg-yellow-500' },
  { id: 'airtel_money', label: 'Airtel Money', icon: Smartphone, color: 'bg-red-500' },
  { id: 'bank_card', label: 'Bank Card', icon: CreditCard, color: 'bg-blue-600' },
  { id: 'paypal', label: 'PayPal', icon: Globe, color: 'bg-blue-500' },
] as const

export default function CourseDetail() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const [searchParams] = useSearchParams()
  const [showPayment, setShowPayment] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    if (searchParams.get('payment_success') === '1') {
      toast.success('Payment completed! Your enrollment is being processed.')
      utils.course.myCourses.invalidate()
    } else if (searchParams.get('payment_cancel') === '1') {
      toast.error('Payment was cancelled. You can try again.')
    }
  }, [searchParams, utils.course.myCourses])

  const { data: course } = trpc.course.getBySlug.useQuery({ slug: slug! })
  const { data: myCourses } = trpc.course.myCourses.useQuery(undefined, { enabled: !!user })
  const enroll = trpc.course.enroll.useMutation({
    onSuccess: (data) => {
      if (data.paymentStatus === 'paid') {
        toast.success('Successfully enrolled!')
      } else {
        toast.info('Enrollment created. Payment is required to access course content.')
      }
      utils.course.myCourses.invalidate()
    },
  })

  const initiatePayment = trpc.payment.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setPaymentInfo(data)
      toast.success('Enrollment created! Follow instructions to complete payment.')
    },
    onError: (err) => toast.error(err.message),
  })

  const confirmPayment = trpc.payment.confirmPayment.useMutation({
    onSuccess: () => {
      toast.success('Payment confirmed! Access granted.')
      utils.course.myCourses.invalidate()
      setShowPayment(false)
      setSelectedMethod(null)
      setPaymentInfo(null)
    },
    onError: (err) => toast.error(err.message),
  })

  const myEnrollment = myCourses?.find((c: any) => c.id === course?.id)
  const isEnrolled = !!myEnrollment
  const isPaid = myEnrollment?.paymentStatus === 'paid'
  const isFree = course && Number(course.price) === 0

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400">Loading course...</div>
      </div>
    )
  }

  const learningOutcomes = (course.learningOutcomes as string[] | null) ?? []
  const requirements = (course.requirements as string[] | null) ?? []

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-white/20 text-white">{course.level}</Badge>
            <Badge className="bg-white/20 text-white">{t(`categories.${course.categorySlug}`, { defaultValue: course.categoryName })}</Badge>
            <Badge className="bg-white/20 text-white">{course.language}</Badge>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t(`courseTitles.${course.slug}`, { defaultValue: course.title })}</h1>
          <p className="text-lg text-slate-300 mb-6 max-w-3xl">{course.description}</p>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-400 fill-amber-400" /> {course.rating} rating</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.totalStudents} students</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {course.duration} minutes</span>
            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.totalLessons} lessons</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="curriculum">
            <TabsList className="w-full">
              <TabsTrigger value="curriculum" className="flex-1">Curriculum</TabsTrigger>
              <TabsTrigger value="outcomes" className="flex-1">What You Will Learn</TabsTrigger>
              <TabsTrigger value="requirements" className="flex-1">Requirements</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="mt-6">
              {course.modules?.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((mod: any) => (
                    <Card key={mod.id}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">{mod.title}</h3>
                        <div className="space-y-2">
                          {course.lessons?.filter((l: any) => l.moduleId === mod.id).map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                {lesson.isFree ? <Play className="h-3 w-3 text-blue-600" /> : <LockIcon />}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{lesson.title}</div>
                                <div className="text-xs text-slate-500">{lesson.duration} mins</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No modules available yet</div>
              )}
            </TabsContent>

            <TabsContent value="outcomes" className="mt-6">
              <div className="grid gap-3">
                {learningOutcomes.map((outcome: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{outcome}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="mt-6">
              <div className="space-y-3">
                {requirements.length > 0 ? requirements.map((req: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                )) : (
                  <p className="text-slate-500">No specific requirements for this course.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-slate-100">
                <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover" />
              </div>

              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-bold">
                  {Number(course.price) === 0 ? 'Free' : `${Number(course.price).toLocaleString()} Frw`}
                </span>
                {course.originalPrice && Number(course.originalPrice) > Number(course.price) && (
                  <span className="text-lg text-slate-400 line-through mb-1">{Number(course.originalPrice).toLocaleString()} Frw</span>
                )}
              </div>

              {!user ? (
                <Link to={`/courses/${slug}/lessons/${course.lessons?.[0]?.id ?? ''}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white mb-3">
                    <Play className="mr-2 h-4 w-4" /> Start Free Preview
                  </Button>
                </Link>
              ) : isEnrolled && isPaid ? (
                <Button className="w-full bg-emerald-500 text-white mb-3" disabled>
                  <Award className="mr-2 h-4 w-4" /> Enrolled
                </Button>
              ) : isEnrolled && !isPaid ? (
                showPayment && paymentInfo ? (
                  <div className="space-y-3 mb-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3">
                        <Smartphone className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">Payment Instructions</h4>
                      <p className="text-xs text-slate-500 mb-1">Amount: <strong>{Number(paymentInfo.amount).toLocaleString()} {paymentInfo.currency.toUpperCase()}</strong></p>
                      <p className="text-xs text-slate-500 mb-1">Method: <strong>{paymentInfo.method}</strong></p>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 my-3 border text-sm">
                        {paymentInfo.instructions}
                      </div>
                      <Button
                        onClick={() => confirmPayment.mutate({ paymentId: paymentInfo.paymentId })}
                        disabled={confirmPayment.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2"
                      >
                        {confirmPayment.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'I Have Paid — Confirm'}
                      </Button>
                      <p className="text-xs text-slate-400">Send exact amount to the number shown, then click confirm.</p>
                    </div>
                  </div>
                ) : showPayment ? (
                  <div className="space-y-2 mb-3">
                    <h4 className="font-semibold text-sm text-center mb-2">Choose Payment Method</h4>
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon
                      const isLoading = initiatePayment.isPending && selectedMethod === method.id
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedMethod(method.id)
                            initiatePayment.mutate({ courseId: course.id, paymentMethod: method.id })
                          }}
                          disabled={initiatePayment.isPending}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 hover:shadow-md transition-all disabled:opacity-50 w-full text-left"
                        >
                          <div className={`w-9 h-9 rounded-lg ${method.color} flex items-center justify-center flex-shrink-0`}>
                            {isLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Icon className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-slate-900 dark:text-slate-100">{method.label}</p>
                            <p className="text-[10px] text-slate-500">
                              {method.id === 'mtn_mobile_money' || method.id === 'airtel_money' ? 'Mobile money' : method.id === 'bank_card' ? 'Visa / MasterCard' : 'Pay online'}
                            </p>
                          </div>
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-amber-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" onClick={() => setShowPayment(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white mb-3"
                    onClick={() => setShowPayment(true)}
                  >
                    Pay Now — {Number(course.price).toLocaleString()} Frw
                  </Button>
                )
              ) : isFree ? (
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white mb-3"
                  onClick={() => enroll.mutate({ courseId: course.id })}
                  disabled={enroll.isPending}
                >
                  <Award className="mr-2 h-4 w-4" />
                  {enroll.isPending ? 'Enrolling...' : 'Enroll Now (Free)'}
                </Button>
              ) : (
                showPayment && paymentInfo ? (
                  <div className="space-y-3 mb-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3">
                        <Smartphone className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">Payment Instructions</h4>
                      <p className="text-xs text-slate-500 mb-1">Amount: <strong>{Number(paymentInfo.amount).toLocaleString()} {paymentInfo.currency.toUpperCase()}</strong></p>
                      <p className="text-xs text-slate-500 mb-1">Method: <strong>{paymentInfo.method}</strong></p>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3 my-3 border text-sm">
                        {paymentInfo.instructions}
                      </div>
                      <Button
                        onClick={() => confirmPayment.mutate({ paymentId: paymentInfo.paymentId })}
                        disabled={confirmPayment.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-2"
                      >
                        {confirmPayment.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'I Have Paid — Confirm'}
                      </Button>
                      <p className="text-xs text-slate-400">Send exact amount to the number shown, then click confirm.</p>
                    </div>
                  </div>
                ) : showPayment ? (
                  <div className="space-y-2 mb-3">
                    <h4 className="font-semibold text-sm text-center mb-2">Choose Payment Method</h4>
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon
                      const isLoading = initiatePayment.isPending && selectedMethod === method.id
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedMethod(method.id)
                            initiatePayment.mutate({ courseId: course.id, paymentMethod: method.id })
                          }}
                          disabled={initiatePayment.isPending}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 hover:shadow-md transition-all disabled:opacity-50 w-full text-left"
                        >
                          <div className={`w-9 h-9 rounded-lg ${method.color} flex items-center justify-center flex-shrink-0`}>
                            {isLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Icon className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs text-slate-900 dark:text-slate-100">{method.label}</p>
                            <p className="text-[10px] text-slate-500">
                              {method.id === 'mtn_mobile_money' || method.id === 'airtel_money' ? 'Mobile money' : method.id === 'bank_card' ? 'Visa / MasterCard' : 'Pay online'}
                            </p>
                          </div>
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin text-amber-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500" onClick={() => setShowPayment(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white mb-3"
                    onClick={() => setShowPayment(true)}
                  >
                    <Award className="mr-2 h-4 w-4" />
                    Enroll Now — {Number(course.price).toLocaleString()} Frw
                  </Button>
                )
              )}

              <div className="space-y-3 text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-medium">{course.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lessons</span>
                  <span className="font-medium">{course.totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Level</span>
                  <span className="font-medium capitalize">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Language</span>
                  <span className="font-medium uppercase">{course.language}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Students</span>
                  <span className="font-medium">{course.totalStudents}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle className="h-3 w-3 text-emerald-500" /> Full lifetime access
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" /> Certificate of completion
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

