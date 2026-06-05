import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { trpc } from '@/providers/trpc'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation()

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate({ token })
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Link</CardTitle>
            <CardDescription className="mt-2 text-base">
              The verification link is missing or invalid.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center mt-4">
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (verifyEmailMutation.isPending || verifyEmailMutation.isIdle) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
            <CardDescription className="mt-2 text-base">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (verifyEmailMutation.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription className="mt-2 text-base">
              {verifyEmailMutation.error.message || 'The verification link may be expired or invalid.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center mt-4">
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center py-8">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified</CardTitle>
          <CardDescription className="mt-2 text-base">
            Your email has been successfully verified. You can now log in to your account.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button asChild className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
