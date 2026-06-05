import { useSearchParams, Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const courseId = searchParams.get('course_id')

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <Card className="max-w-md w-full text-center shadow-lg border-emerald-100 dark:border-emerald-900/50">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Thank you for your purchase. You are now officially enrolled in the course and can start learning immediately.
          </p>

          <div className="space-y-4 w-full">
            <Link to="/dashboard" className="block w-full">
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            </Link>
            
            <Link to="/courses" className="block w-full">
              <Button variant="outline" className="w-full h-12">
                Browse More Courses <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
