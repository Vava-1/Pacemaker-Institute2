import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>
        <Card>
          <CardContent className="p-8 prose dark:prose-invert max-w-none">
            <h1>Cookie Policy</h1>
            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They are widely used to
              make websites work, improve efficiency, and provide information to the site owners.
            </p>

            <h2>Cookies We Use</h2>

            <h3>Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function. They include authentication tokens
              (HttpOnly cookies) that keep you signed in. These cannot be disabled.
            </p>
            <ul>
              <li><code>access_token</code> - JWT access token (15 min, HttpOnly)</li>
              <li><code>refresh_token</code> - JWT refresh token (7 days, HttpOnly)</li>
            </ul>

            <h3>Preference Cookies</h3>
            <p>
              These remember your choices, such as dark/light mode and language.
            </p>
            <ul>
              <li><code>theme</code> - Stores light/dark preference</li>
            </ul>

            <h3>Analytics Cookies (Optional)</h3>
            <p>
              These help us understand how visitors use the site so we can improve it. They are only set after
              you accept cookies.
            </p>

            <h3>Marketing Cookies (Optional)</h3>
            <p>
              Used to track visitors across websites to display relevant ads. We currently do not use marketing
              cookies, but reserve the option to do so in the future.
            </p>

            <h2>Managing Cookies</h2>
            <p>
              You can control cookies through our cookie consent banner (visible on your first visit) or through
              your browser settings. Blocking essential cookies will prevent the site from working correctly.
            </p>

            <h2>Third-Party Cookies</h2>
            <p>
              Some cookies are set by third-party services we use:
            </p>
            <ul>
              <li>Stripe (payment processing) - <Link to="https://stripe.com/cookies" target="_blank" rel="noopener">stripe.com/cookies</Link></li>
              <li>Cloudinary (media) - <Link to="https://cloudinary.com/privacy" target="_blank" rel="noopener">cloudinary.com/privacy</Link></li>
            </ul>

            <h2>Updates</h2>
            <p>
              We may update this policy from time to time. We will notify you of changes by posting the new
              policy on this page.
            </p>

            <h2>Contact</h2>
            <p>
              Questions? Contact {'<!-- TODO: Replace with actual email -->'} privacy@pacemaker.institute.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
