import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
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
            <h1>Privacy Policy</h1>
            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Information We Collect</h2>
            <p>We collect several types of information for various purposes to provide and improve our Service:</p>
            <ul>
              <li><strong>Personal Data:</strong> Name, email address, profile picture, password (hashed).</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent, course progress, exercise results.</li>
              <li><strong>Payment Data:</strong> Processed by Stripe; we never see your card number.</li>
              <li><strong>Cookies:</strong> See our <Link to="/cookies">Cookie Policy</Link>.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain the Service.</li>
              <li>To notify you about changes to the Service.</li>
              <li>To allow you to participate in interactive features.</li>
              <li>To provide customer support.</li>
              <li>To monitor usage and detect/prevent technical issues.</li>
              <li>To power our AI tutor (messages you send to the AI tutor are sent to our AI provider).</li>
            </ul>

            <h2>3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul>
              <li><strong>Stripe</strong> - to process payments.</li>
              <li><strong>Anthropic</strong> - to power the AI tutor (your messages only).</li>
              <li><strong>Cloudinary</strong> - to host uploaded media.</li>
              <li><strong>Email providers (SMTP)</strong> - to send verification and notification emails.</li>
              <li><strong>Analytics</strong> - aggregated, anonymized usage statistics.</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain your personal data only for as long as is necessary for the purposes set out in this
              policy. You can request deletion of your account and all associated data at any time by contacting
              us.
            </p>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to processing of your data.</li>
              <li>Request portability of your data.</li>
            </ul>

            <h2>6. Security</h2>
            <p>
              We use industry-standard security measures including HTTPS, bcrypt password hashing, JWT-based
              authentication with HttpOnly cookies, and database connection encryption. No method of transmission
              over the Internet, however, is 100% secure.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally
              identifiable information from children under 13.
            </p>

            <h2>8. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. By using the
              Service, you consent to such transfers.
            </p>

            <h2>9. Contact</h2>
            <p>
              For privacy-related requests, contact {'<!-- TODO: Replace with actual DPO email -->'}
              privacy@pacemaker.institute.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
