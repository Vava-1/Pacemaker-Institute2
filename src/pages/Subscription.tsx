import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react'

export default function Subscription() {
  const { user } = useAuth()
  const { data: plans } = trpc.subscription.plans.useQuery()
  const { data: mySub } = trpc.subscription.mySubscription.useQuery(undefined, { enabled: !!user })

  const planConfig = [
    { gradient: 'from-slate-500 to-slate-600', icon: Sparkles, buttonText: 'Get Started' },
    { gradient: 'from-blue-600 to-purple-600', icon: Zap, buttonText: 'Upgrade to Pro', popular: true },
    { gradient: 'from-amber-500 to-orange-600', icon: Crown, buttonText: 'Go Expert' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Unlock your full potential with our premium plans. Get unlimited access to courses, AI tutoring, and exclusive features.
        </p>
        {mySub && (
          <Badge className="mt-4 bg-emerald-500 text-white">
            Current Plan: {mySub.planName}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan, i) => {
          const config = planConfig[i] ?? planConfig[0]
          const Icon = config.icon
          const features = (plan.features as string[] | null) ?? []
          const isCurrentPlan = mySub?.planSlug === plan.slug

          return (
            <Card key={plan.id} className={`relative overflow-hidden ${config.popular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : ''}`}>
              {config.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <CardHeader className={`bg-gradient-to-br ${config.gradient} text-white`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-6 w-6" />
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-white/70 text-sm mb-1">/month</span>
                </div>
                <p className="text-white/80 text-sm mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-3 mb-6">
                  {features.map((feature: string, fi: number) => (
                    <div key={fi} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {user ? (
                  <Button
                    className={`w-full ${isCurrentPlan ? 'bg-slate-100 text-slate-500' : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : config.buttonText}
                    {!isCurrentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button className={`w-full bg-gradient-to-r ${config.gradient} text-white`}>
                      Login to Subscribe
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
