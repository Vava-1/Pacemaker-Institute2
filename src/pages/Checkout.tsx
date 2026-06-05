import { useParams, Link } from 'react-router'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  
  const { data: course, isLoading } = trpc.course.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  )

  const createCheckoutSession = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to initialize checkout')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred during checkout')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400">Loading checkout...</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Course not found</h2>
        <Link to="/courses">
          <Button variant="outline">Browse Courses</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Course
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-slate-500">Complete your purchase to enroll in this course.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={course.thumbnail ?? ''} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{course.level}</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Price</span>
                  <span>${course.price}</span>
                </div>
                {course.originalPrice && Number(course.originalPrice) > Number(course.price) && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount</span>
                    <span className="text-emerald-500">-${(Number(course.originalPrice) - Number(course.price)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total</span>
                  <span>${course.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-4 rounded-lg text-sm">
                  Please log in to complete your purchase and save this course to your account.
                  <div className="mt-3">
                    <Link to="/login">
                      <Button className="w-full">Log In</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <strong>Secure Checkout.</strong> Your payment information is encrypted and securely processed by Stripe.
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-lg bg-[#635BFF] hover:bg-[#5851E5] text-white"
                    onClick={() => createCheckoutSession.mutate({ courseId: course.id })}
                    disabled={createCheckoutSession.isPending}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {createCheckoutSession.isPending ? 'Processing...' : 'Pay with Stripe'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
