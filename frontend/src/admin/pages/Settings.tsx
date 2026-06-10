import { useState, useEffect } from 'react'
import { trpc } from '@/providers/trpc'
import { toast } from 'sonner'
import { Mail, CreditCard, Brain, Save, RefreshCw } from 'lucide-react'

type SettingsMap = Record<string, string>

const settingFields = [
  { key: 'smtp_host', label: 'SMTP Host', group: 'smtp', placeholder: 'smtp.sendgrid.net' },
  { key: 'smtp_port', label: 'SMTP Port', group: 'smtp', placeholder: '587' },
  { key: 'smtp_user', label: 'SMTP Username', group: 'smtp', placeholder: 'apikey' },
  { key: 'smtp_pass', label: 'SMTP Password', group: 'smtp', placeholder: '••••••••', type: 'password' },
  { key: 'smtp_from', label: 'From Email', group: 'smtp', placeholder: 'noreply@pacemaker.com' },
  { key: 'stripe_publishable_key', label: 'Publishable Key', group: 'stripe', placeholder: 'pk_test_...' },
  { key: 'stripe_secret_key', label: 'Secret Key', group: 'stripe', placeholder: 'sk_test_...', type: 'password' },
  { key: 'stripe_webhook_secret', label: 'Webhook Secret', group: 'stripe', placeholder: 'whsec_...', type: 'password' },
  { key: 'anthropic_api_key', label: 'Anthropic API Key', group: 'ai', placeholder: 'sk-ant-...', type: 'password' },
  { key: 'anthropic_model', label: 'Model', group: 'ai', placeholder: 'claude-3-5-sonnet-20241022' },
]

export default function Settings() {
  const [form, setForm] = useState<SettingsMap>({})

  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery()
  const updateMutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => toast.success('Settings saved successfully'),
    onError: () => toast.error('Failed to save settings'),
  })

  useEffect(() => {
    if (Array.isArray(settings)) {
      const map: SettingsMap = {}
      for (const item of settings) {
        if (item.settingKey) {
          map[item.settingKey] = item.settingValue ?? ''
        }
      }
      setForm(map)
    }
  }, [settings])

  const handleSave = () => {
    updateMutation.mutate(
      Object.entries(form).map(([key, value]) => ({ key, value })),
    )
  }

  if (isLoading) return <div className="flex items-center justify-center h-48"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>

  const groups = [
    { key: 'smtp', label: 'SMTP Configuration', icon: Mail, description: 'Configure email delivery settings for transactional emails.' },
    { key: 'stripe', label: 'Stripe Integration', icon: CreditCard, description: 'Manage payment gateway API keys and webhook secrets.' },
    { key: 'ai', label: 'AI Assistant', icon: Brain, description: 'Configure Anthropic Claude integration for the PI Assistant.' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Platform Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage API keys and configuration for platform services.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {updateMutation.isPending ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {groups.map(({ key, label, icon: Icon, description }) => {
        const fields = settingFields.filter((f) => f.group === key)
        return (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                <Icon className="h-4 w-4 text-teal-700" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
                <p className="text-xs text-slate-400">{description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
