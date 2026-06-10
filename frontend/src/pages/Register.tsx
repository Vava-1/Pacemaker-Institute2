import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/providers/trpc'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

export default function Register() {
  const { t } = useTranslation()
  const [step, setStep] = useState<'register' | 'otp'>('register')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const registerSchema = z.object({
    name: z.string().min(2, t('register.validationNameMin')),
    email: z.string().email(t('register.validationEmail')),
    password: z.string()
      .min(8, t('register.validationPasswordMin'))
      .regex(/[A-Z]/, t('register.validationPasswordUpper'))
      .regex(/[a-z]/, t('register.validationPasswordLower'))
      .regex(/[0-9]/, t('register.validationPasswordNumber'))
      .regex(/[^A-Za-z0-9]/, t('register.validationPasswordSpecial')),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('register.validationPasswordsMatch'),
    path: ["confirmPassword"],
  })

  type RegisterFormValues = z.infer<typeof registerSchema>

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setRegisteredEmail(form.getValues('email'))
      if ((data as any).devOtp) {
        setDevOtp((data as any).devOtp)
      }
      setStep('otp')
      toast.success(t('register.registrationSuccess'))
      startResendCooldown()
    },
    onError: (error) => {
      toast.error(error.message || t('register.failedToRegister'))
    },
  })

  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: () => {
      toast.success(t('register.emailVerifiedSuccess'))
    },
    onError: (error) => {
      toast.error(error.message || t('register.failedToVerifyOtp'))
    },
  })

  const resendOtpMutation = trpc.auth.resendOtp.useMutation({
    onSuccess: (data) => {
      if ((data as any).devOtp) {
        setDevOtp((data as any).devOtp)
      }
      toast.success(t('register.newOtpSent'))
      startResendCooldown()
    },
    onError: (error) => {
      toast.error(error.message || t('register.failedToResendOtp'))
    },
  })

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function onSubmit(data: RegisterFormValues) {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    })
  }

  function handleOtpSubmit() {
    if (otp.length !== 6) return
    verifyOtpMutation.mutate({ email: registeredEmail, code: otp })
  }

  function handleResendOtp() {
    if (resendCooldown > 0) return
    resendOtpMutation.mutate({ email: registeredEmail })
  }

  if (step === 'otp') {
    const isVerified = verifyOtpMutation.isSuccess
    
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center py-8">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isVerified ? t('register.emailVerified') : t('register.verifyEmail')}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              {isVerified ? (
                t('register.verifiedSuccess')
              ) : (
                <>
                  {t('register.sentCode')} <strong>{registeredEmail}</strong>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
              {!isVerified && (
              <>
                {devOtp && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-medium">{t('register.devOtp')}</p>
                    <p className="mt-1 text-2xl font-mono font-bold tracking-widest">{devOtp}</p>
                    <p className="mt-1 text-xs text-amber-600">{t('register.noEmailSent')}</p>
                  </div>
                )}
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={verifyOtpMutation.isPending}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {verifyOtpMutation.isError && (
                  <p className="text-sm text-red-500">{verifyOtpMutation.error.message}</p>
                )}
                <Button
                  onClick={handleOtpSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={otp.length !== 6 || verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('register.verifyEmailBtn')}
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t('register.didntReceiveCode')}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendOtpMutation.isPending}
                  >
                    <RefreshCw className={`mr-1 h-3 w-3 ${resendOtpMutation.isPending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `${t('register.resendIn')} ${resendCooldown}s` : t('register.resend')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            {isVerified ? (
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/login">{t('register.goToLogin')}</Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => { setStep('register'); setOtp('') }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('register.backToRegistration')}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">{t('register.createAccount')}</CardTitle>
          <CardDescription>
            {t('register.enterDetails')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.nameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('register.namePlaceholder')}
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('register.emailPlaceholder')}
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('register.passwordPlaceholder')}
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('register.confirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('register.registerBtn')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <span className="text-muted-foreground mr-1">
            {t('register.alreadyHaveAccount')}
          </span>
          <Link to="/login" className="text-primary hover:underline">
            {t('register.signIn')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
