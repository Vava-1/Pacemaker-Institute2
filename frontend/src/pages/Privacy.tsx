import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const COMPANY_NAME = "Pacemaker Institute";
const COMPANY_ADDRESS = "123 Education Lane, Tech City, TC 12345";
const DPO_EMAIL = "dpo@pacemaker.institute";
const COMPANY_EMAIL = "privacy@pacemaker.institute";
const EFFECTIVE_DATE = "June 7, 2026";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>

        <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
            This Privacy Policy describes how {COMPANY_NAME} collects, uses, and protects your personal data. It applies to all users of our platform globally.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-slate-500">Effective Date: {EFFECTIVE_DATE}</p>

            <h2>1. Introduction</h2>
            <p>This Privacy Policy explains how {COMPANY_NAME} ("we", "us", "our") collects, uses, discloses, and safeguards your personal data when you use our e-learning platform. This policy applies to all users, including students, instructors, and visitors.</p>
            <p>We are committed to protecting your privacy and complying with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p>

            <h2>2. Data Controller</h2>
            <p>The data controller responsible for your personal data is:</p>
            <ul>
              <li>{COMPANY_NAME}</li>
              <li>Address: {COMPANY_ADDRESS}</li>
              <li>Data Protection Officer (DPO) Email: {DPO_EMAIL}</li>
            </ul>

            <h2>3. Information We Collect</h2>

            <h3>3.1 Personal Data You Provide Directly</h3>
            <ul>
              <li>Account information: name, email address, password (hashed), profile picture.</li>
              <li>Learning data: course progress, quiz answers, exercise results, certificates earned.</li>
              <li>Payment information: billing address (processed by Stripe; we never see full card details).</li>
              <li>Communications: messages sent via our AI tutor, forum posts, support inquiries.</li>
              <li>Instructor data: course content, biography, qualifications, bank account details for payouts.</li>
            </ul>

            <h3>3.2 Automatically Collected Data</h3>
            <ul>
              <li>Device information: IP address, browser type, operating system, device identifiers.</li>
              <li>Usage data: pages visited, time spent on each page, click patterns, feature usage.</li>
              <li>Performance data: page load times, error logs, API response times.</li>
              <li>Location data: approximate geographic location derived from IP address.</li>
            </ul>

            <h3>3.3 Data from Third Parties</h3>
            <ul>
              <li>Google OAuth: if you sign in with Google, we receive your name, email, and profile picture.</li>
              <li>Stripe: we receive payment status, transaction IDs, and billing details (not full card numbers).</li>
              <li>Anthropic: AI tutor queries are transmitted to Anthropic for response generation.</li>
            </ul>

            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>We process your personal data on the following legal bases:</p>
            <ul>
              <li><strong>Contractual Necessity:</strong> Processing required to provide our e-learning services, manage your account, and process transactions.</li>
              <li><strong>Legitimate Interests:</strong> Processing for analytics, platform improvement, security monitoring, and fraud prevention.</li>
              <li><strong>Legal Obligation:</strong> Processing required to comply with applicable laws and regulatory obligations.</li>
              <li><strong>Consent:</strong> Processing for marketing communications, cookies (except essential), and optional data sharing. You may withdraw consent at any time.</li>
            </ul>

            <h2>5. How We Use Your Information</h2>
            <p>We use your personal data for the following purposes:</p>
            <ul>
              <li>To create and manage your account.</li>
              <li>To provide, personalize, and improve our educational content and platform.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To communicate with you about your account, courses, and platform updates.</li>
              <li>To power our AI tutor (messages you send are transmitted to Anthropic for processing).</li>
              <li>To analyze usage patterns and improve platform performance.</li>
              <li>To detect, prevent, and address fraud, security issues, and abuse.</li>
              <li>To comply with legal obligations and enforce our Terms of Service.</li>
              <li>To send promotional communications (with your consent).</li>
              <li>To generate anonymized, aggregated analytics reports.</li>
              <li>To provide customer support and respond to your inquiries.</li>
            </ul>

            <h2>6. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. We may share your data with the following categories of recipients:</p>
            <ul>
              <li>
                <strong>Stripe (Payment Processing):</strong> Payment information is sent directly to Stripe. We receive only transaction status and identifiers.
                <br /><a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe Privacy Policy</a>
              </li>
              <li>
                <strong>Anthropic (AI Tutor):</strong> Your messages and course context are transmitted to Anthropic to generate AI tutor responses.
                <br /><a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener">Anthropic Privacy Policy</a>
              </li>
              <li>
                <strong>Cloudinary (Media Hosting):</strong> Images and files you upload are stored on Cloudinary's infrastructure.
                <br /><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener">Cloudinary Privacy Policy</a>
              </li>
              <li>
                <strong>SMTP Providers (Email):</strong> Your name and email address are shared with our email delivery providers for transactional emails.
              </li>
              <li>
                <strong>Render (Hosting):</strong> Data is stored on Render's infrastructure in the region you select during account setup.
                <br /><a href="https://render.com/privacy" target="_blank" rel="noopener">Render Privacy Policy</a>
              </li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>We retain your personal data for the following periods:</p>
            <ul>
              <li><strong>Account data:</strong> Retained until 2 years after account deletion, then anonymized or deleted.</li>
              <li><strong>Course progress and learning data:</strong> Retained for 7 years after last activity.</li>
              <li><strong>Payment records:</strong> Retained for 7 years to comply with tax and legal obligations.</li>
              <li><strong>Communications and support tickets:</strong> Retained for 3 years.</li>
              <li><strong>AI tutor conversations:</strong> Retained for 90 days after the last message.</li>
              <li><strong>Server logs:</strong> Retained for 90 days.</li>
            </ul>

            <h2>8. Your Data Protection Rights</h2>
            <p>Depending on your jurisdiction, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request deletion of your personal data.</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data.</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time without affecting the lawfulness of prior processing.</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority.</li>
            </ul>
            <p>To exercise any of these rights, contact us at {DPO_EMAIL}. We will respond to your request within thirty (30) days.</p>

            <h2>9. Data Security</h2>
            <p>We implement the following security measures to protect your data:</p>
            <ul>
              <li>All data transmitted via TLS 1.3 encryption (HTTPS).</li>
              <li>Passwords hashed with bcrypt (cost factor 12).</li>
              <li>Authentication tokens stored in HttpOnly, secure, same-site cookies.</li>
              <li>Database credentials encrypted at rest.</li>
              <li>API rate limiting to prevent abuse.</li>
              <li>24/7 automated monitoring and intrusion detection.</li>
              <li>Regular security audits and penetration testing.</li>
            </ul>

            <h2>10. International Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:</p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
              <li>Adequacy decisions for countries deemed to have adequate data protection.</li>
              <li>Data Processing Agreements (DPAs) with all sub-processors.</li>
            </ul>

            <h2>11. Children's Privacy</h2>
            <p>Our Service is not directed to children under 13 years of age. We do not knowingly collect personal data from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us at {DPO_EMAIL}.</p>
            <p>Users between 13 and 17 years of age require parental consent to use the Service, in compliance with the Children's Online Privacy Protection Act (COPPA).</p>

            <h2>12. Cookies and Tracking Technologies</h2>
            <p>We use cookies and similar tracking technologies to provide and improve our Service. For detailed information about the cookies we use, please see our <Link to="/cookies">Cookie Policy</Link>.</p>

            <h2>13. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or through a prominent notice on the platform at least thirty (30) days before they take effect. We encourage you to review this policy periodically.</p>

            <h2>14. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy:</p>
            <ul>
              <li>Data Protection Officer: {DPO_EMAIL}</li>
              <li>General Privacy Inquiries: {COMPANY_EMAIL}</li>
              <li>Address: {COMPANY_ADDRESS}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
