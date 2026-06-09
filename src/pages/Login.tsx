import { useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { trpc, setAuthToken } from '@/providers/trpc'

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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const loginSchema = z.object({
    email: z.string().email(t('auth.validationEmail')),
    password: z.string().min(1, t('auth.validationPasswordRequired')),
  })

  type LoginFormValues = z.infer<typeof loginSchema>

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const utils = trpc.useUtils()
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuthToken(data.accessToken)
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken)
      }
      toast.success(t('auth.loggedInSuccess'))
      utils.auth.me.invalidate()
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.message || t('auth.failedToLogin'))
    },
  })

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-950 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-950">Pacemaker Institute</h1>
          <p className="text-slate-500 text-sm mt-1">{t('auth.signInToAccount')}</p>
        </div>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-brand-950">{t('auth.welcomeBack')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-brand-950">{t('auth.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          {...field}
                          disabled={loginMutation.isPending}
                          className="border-slate-200/80 focus-visible:ring-blue-500"
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-brand-950">{t('auth.passwordLabel')}</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-blue-600 hover:text-blue-700"
                          tabIndex={-1}
                        >
                          {t('auth.forgotPassword')}
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('auth.passwordPlaceholder')}
                          {...field}
                          disabled={loginMutation.isPending}
                          className="border-slate-200/80 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('auth.signIn')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm border-t border-slate-100 pt-4">
            <span className="text-slate-500 mr-1">{t('auth.dontHaveAccount')}</span>
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('auth.register')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
