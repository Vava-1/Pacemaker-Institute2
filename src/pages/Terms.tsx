import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
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
            <h1>Terms of Service</h1>
            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Pacemaker Institute ("the Service", "we", "us"), you agree to be bound by these
              Terms of Service. If you disagree with any part of these terms, you may not use the Service.
            </p>

            <h2>2. Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and current information.
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of
              your account.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any
              activities or actions under your password.
            </p>

            <h2>3. Subscriptions and Payments</h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a
              recurring and periodic basis (monthly or yearly). Subscriptions auto-renew unless cancelled at
              least 24 hours before the end of the current period.
            </p>
            <p>
              Refunds are issued at our sole discretion, except where required by applicable law.
            </p>

            <h2>4. Content</h2>
            <p>
              Our Service allows you to post, link, store, share and otherwise make available certain information,
              text, graphics, videos, or other material. You retain ownership of any intellectual property rights
              that you hold in that content.
            </p>
            <p>
              Instructors retain ownership of the courses they create. By publishing a course on the platform, the
              instructor grants Pacemaker Institute a worldwide, non-exclusive, royalty-free license to distribute
              the course.
            </p>

            <h2>5. Prohibited Uses</h2>
            <ul>
              <li>Violating any applicable laws or regulations.</li>
              <li>Infringing the intellectual property rights of others.</li>
              <li>Uploading viruses, malware, or any malicious code.</li>
              <li>Attempting to gain unauthorized access to the Service.</li>
              <li>Harassing, abusing, or harming other users.</li>
              <li>Reselling or redistributing course content without permission.</li>
            </ul>

            <h2>6. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any
              reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall Pacemaker Institute, its directors, employees, partners, agents, suppliers, or
              affiliates be liable for any indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>

            <h2>8. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of {'<!-- TODO: Replace with actual jurisdiction -->'}, without regard to its conflict of law provisions.
            </p>

            <h2>9. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
              revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at
              {'<!-- TODO: Replace with actual company email -->'} support@pacemaker.institute.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
