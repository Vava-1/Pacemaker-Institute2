import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'pacemaker_cookie_consent_v1'

type Consent = {
  essential: true // always true
  preferences: boolean
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

function getStoredConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Consent
  } catch {
    return null
  }
}

function persist(consent: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  } catch {
    // ignore
  }
}

export function applyConsent(consent: Consent) {
  // Hook point: dispatch a custom event that other code can listen to
  // to enable/disable analytics scripts etc.
  window.dispatchEvent(new CustomEvent('cookie-consent', { detail: consent }))
}

export function getConsent(): Consent | null {
  return getStoredConsent()
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = getStoredConsent()
    if (!existing) {
      // Small delay so the banner doesn't appear instantly on page load
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    } else {
      applyConsent(existing)
    }
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    const c: Consent = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
    }
    persist(c)
    applyConsent(c)
    setVisible(false)
  }

  const rejectNonEssential = () => {
    const c: Consent = {
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
    }
    persist(c)
    applyConsent(c)
    setVisible(false)
  }

  const saveCustom = () => {
    const c: Consent = {
      essential: true,
      preferences: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
    }
    persist(c)
    applyConsent(c)
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-4 flex-col md:flex-row">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">We value your privacy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We use essential cookies to make this site work. We'd also like to set optional cookies to
                understand how you use the platform and improve your experience. You can change your choice at
                any time on our <Link to="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>{' '}
                page.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowDetails((s) => !s)}>
              {showDetails ? 'Hide details' : 'Customize'}
            </Button>
            <Button variant="outline" size="sm" onClick={rejectNonEssential}>
              Reject non-essential
            </Button>
            <Button size="sm" onClick={acceptAll} className="bg-blue-600 hover:bg-blue-700">
              Accept all
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked disabled className="mt-1" />
              <div>
                <p className="font-medium text-sm">Essential (always on)</p>
                <p className="text-xs text-slate-500">Authentication and security cookies.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked readOnly className="mt-1" />
              <div>
                <p className="font-medium text-sm">Preferences</p>
                <p className="text-xs text-slate-500">Remember theme and language.</p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-sm">Analytics</p>
                <p className="text-xs text-slate-500">Help us understand usage patterns.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-sm">Marketing</p>
                <p className="text-xs text-slate-500">Personalized recommendations.</p>
              </div>
            </label>
            <Button onClick={saveCustom} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Save preferences
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
