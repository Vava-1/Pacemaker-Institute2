import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const COMPANY_NAME = "Pacemaker Institute";
const COMPANY_EMAIL = "privacy@pacemaker.institute";
const EFFECTIVE_DATE = "June 7, 2026";

export default function Cookies() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>

        <div className="bg-green-50 dark:bg-green-950 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
          <p className="text-green-800 dark:text-green-200 text-sm font-medium">
            This Cookie Policy explains how {COMPANY_NAME} uses cookies and similar technologies to recognize you when you visit our platform.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose dark:prose-invert max-w-none">
            <h1>Cookie Policy</h1>
            <p className="text-sm text-slate-500">Effective Date: {EFFECTIVE_DATE}</p>

            <h2>1. What Are Cookies</h2>
            <p>Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and provide information to the site owners.</p>
            <p>Cookies can be "persistent" (remain on your device for a set period) or "session" (deleted when you close your browser). This policy covers both types.</p>

            <h2>2. How We Use Cookies</h2>

            <h3>2.1 Essential Cookies</h3>
            <p>These cookies are strictly necessary for the platform to function. They cannot be disabled. They include authentication tokens that keep you signed in and CSRF protection tokens.</p>
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Duration</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>access_token</code></td>
                  <td>15 minutes</td>
                  <td>HttpOnly</td>
                </tr>
                <tr>
                  <td><code>refresh_token</code></td>
                  <td>7 days</td>
                  <td>HttpOnly</td>
                </tr>
                <tr>
                  <td><code>csrf_token</code></td>
                  <td>Session</td>
                  <td>HttpOnly</td>
                </tr>
              </tbody>
            </table>

            <h3>2.2 Preference Cookies</h3>
            <p>These cookies remember your choices and preferences to enhance your experience.</p>
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Duration</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>theme</code></td>
                  <td>1 year</td>
                  <td>Stores light/dark mode preference</td>
                </tr>
                <tr>
                  <td><code>language</code></td>
                  <td>1 year</td>
                  <td>Stores language preference</td>
                </tr>
                <tr>
                  <td><code>cookie_consent</code></td>
                  <td>1 year</td>
                  <td>Records your cookie consent choice</td>
                </tr>
              </tbody>
            </table>

            <h3>2.3 Analytics Cookies (Optional)</h3>
            <p>These cookies help us understand how visitors interact with our platform by collecting anonymized usage data.</p>
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Duration</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>_ga</code></td>
                  <td>2 years</td>
                  <td>Google Analytics</td>
                </tr>
                <tr>
                  <td><code>_gid</code></td>
                  <td>24 hours</td>
                  <td>Google Analytics</td>
                </tr>
                <tr>
                  <td><code>_gat</code></td>
                  <td>1 minute</td>
                  <td>Google Analytics</td>
                </tr>
              </tbody>
            </table>

            <h3>2.4 Marketing Cookies (Optional)</h3>
            <p>We currently do not use marketing cookies. This category is reserved for future use. You will be asked for consent before any marketing cookies are placed.</p>

            <h2>3. Third-Party Cookies</h2>
            <p>Some cookies are placed by third-party services that we use to provide and improve our platform. We do not control these cookies.</p>
            <ul>
              <li><strong>Stripe:</strong> Used for payment processing. <Link to="https://stripe.com/cookies" target="_blank" rel="noopener">Stripe Cookie Policy</Link></li>
              <li><strong>Cloudinary:</strong> Used for media hosting and delivery. <Link to="https://cloudinary.com/privacy" target="_blank" rel="noopener">Cloudinary Privacy Policy</Link></li>
              <li><strong>Google Analytics:</strong> Used for anonymized usage analytics. <Link to="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</Link></li>
            </ul>

            <h2>4. Managing Your Cookie Preferences</h2>

            <h3>4.1 Cookie Consent Banner</h3>
            <p>When you first visit our platform, a cookie consent banner will appear allowing you to choose between:</p>
            <ul>
              <li><strong>Accept All:</strong> Accept all cookies, including analytics and marketing cookies.</li>
              <li><strong>Reject All:</strong> Only accept essential cookies necessary for the platform to function.</li>
              <li><strong>Customize:</strong> Select specific categories of cookies to accept.</li>
            </ul>
            <p>You can change your preferences at any time by clicking the "Cookie Settings" link in the footer.</p>

            <h3>4.2 Browser Settings</h3>
            <p>You can also control cookies through your browser settings:</p>
            <ul>
              <li>Chrome: Settings &gt; Privacy and Security &gt; Cookies and other site data.</li>
              <li>Firefox: Options &gt; Privacy &amp; Security &gt; Cookies and Site Data.</li>
              <li>Safari: Preferences &gt; Privacy &gt; Block cookies.</li>
              <li>Edge: Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data.</li>
            </ul>
            <p>Please note that blocking essential cookies may prevent the platform from functioning correctly.</p>

            <h3>4.3 Do Not Track</h3>
            <p>Our platform does not currently respond to "Do Not Track" (DNT) signals. We honor your cookie preferences as set in the cookie consent banner.</p>

            <h2>5. Cookie Consent Record</h2>
            <p>We record your cookie consent choice for auditing purposes. This record is retained for 2 years.</p>

            <h2>6. Changes to This Cookie Policy</h2>
            <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated effective date. Material changes will be communicated via email or platform notification.</p>

            <h2>7. Contact Us</h2>
            <p>If you have questions about our use of cookies, please contact us at {COMPANY_EMAIL}.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
