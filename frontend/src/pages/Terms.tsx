import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const COMPANY_NAME = "Pacemaker Institute";
const COMPANY_ADDRESS = "123 Education Lane, Tech City, TC 12345";
const COMPANY_EMAIL = "legal@pacemaker.institute";
const COMPANY_PHONE = "+1 (555) 123-4567";
const EFFECTIVE_DATE = "June 7, 2026";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>

        <div className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
            Important Notice: These Terms constitute a legally binding agreement between you and {COMPANY_NAME}. Please read them carefully before using our services. By creating an account or accessing our platform, you agree to be bound by these Terms.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 prose dark:prose-invert max-w-none">
            <h1>Terms of Service</h1>
            <p className="text-sm text-slate-500">Effective Date: {EFFECTIVE_DATE}</p>

            <h2>1. Definitions</h2>
            <p>For the purposes of these Terms of Service:</p>
            <ul>
              <li><strong>"Service"</strong> refers to the Pacemaker Institute e-learning platform, including all associated websites, applications, APIs, and content.</li>
              <li><strong>"User"</strong> refers to any individual who accesses or uses the Service, including but not limited to students, instructors, and visitors.</li>
              <li><strong>"Company"</strong>, <strong>"We"</strong>, <strong>"Us"</strong>, or <strong>"Our"</strong> refers to {COMPANY_NAME}, located at {COMPANY_ADDRESS}.</li>
              <li><strong>"Content"</strong> refers to all materials available on the Service, including course materials, text, graphics, images, videos, code, and other educational resources.</li>
              <li><strong>"Instructor"</strong> refers to a User who creates and publishes courses on the Service.</li>
              <li><strong>"Student"</strong> refers to a User who enrolls in and consumes courses on the Service.</li>
            </ul>

            <h2>2. Acceptance of Terms</h2>
            <p>By accessing or using the Service, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you must not use the Service.</p>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or platform notice at least thirty (30) days before they take effect. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.</p>

            <h2>3. Eligibility</h2>
            <p>By using the Service, you represent and warrant that:</p>
            <ul>
              <li>You are at least 13 years of age.</li>
              <li>If you are between 13 and 17 years of age, you have obtained parental or legal guardian consent to use the Service.</li>
              <li>You have the full power and authority to enter into this agreement.</li>
              <li>You are not located in a country that is subject to a U.S. government embargo.</li>
            </ul>

            <h2>4. Account Registration and Security</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete registration information.</li>
              <li>Maintain and promptly update your account information.</li>
              <li>Use strong passwords (minimum 8 characters with mixed case, numbers, and special characters).</li>
              <li>Notify us immediately of any unauthorized use of your account at {COMPANY_EMAIL}.</li>
              <li>Not share your account credentials with any third party.</li>
            </ul>

            <h2>5. Subscriptions and Payments</h2>

            <h3>5.1 Pricing and Billing</h3>
            <p>All prices are listed in U.S. dollars unless otherwise stated. We reserve the right to modify pricing at any time, with changes taking effect at the start of the next billing cycle.</p>

            <h3>5.2 Subscription Terms</h3>
            <p>Subscriptions automatically renew at the end of each billing period unless cancelled at least twenty-four (24) hours before the renewal date. You authorize us to charge your payment method at the beginning of each billing period.</p>

            <h3>5.3 Refunds</h3>
            <p>You may request a full refund within fourteen (14) days of purchase, provided you have completed less than twenty percent (20%) of the course content. Subscription fees are refundable on a pro-rata basis for the unused portion of the current billing period. Refund requests must be submitted via email to {COMPANY_EMAIL}.</p>

            <h3>5.4 Payment Processing</h3>
            <p>All payment processing is handled securely by Stripe, Inc. We do not store or process credit card information on our servers. By making a purchase, you agree to Stripe's terms of service and privacy policy.</p>

            <h2>6. Content and Intellectual Property</h2>

            <h3>6.1 User-Generated Content</h3>
            <p>By submitting content to the Service (including comments, reviews, and forum posts), you grant {COMPANY_NAME} a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, and distribute such content for the purpose of operating and improving the Service.</p>

            <h3>6.2 Instructor Content License</h3>
            <p>Instructors retain ownership of the course content they create. By publishing courses on the platform, instructors grant {COMPANY_NAME}:</p>
            <ul>
              <li>A non-exclusive, worldwide license to host, store, and stream the content.</li>
              <li>The right to sublicense the content to enrolled students for personal educational use.</li>
              <li>The right to use course metadata (title, description, thumbnail) for marketing purposes.</li>
              <li>The right to remove content that violates these Terms.</li>
            </ul>

            <h3>6.3 Prohibited Content</h3>
            <p>You may not upload, post, or share content that:</p>
            <ul>
              <li>Infringes on any third-party intellectual property rights.</li>
              <li>Contains hate speech, discrimination, or harassment.</li>
              <li>Depicts violence, exploitation, or illegal activities.</li>
              <li>Contains malware, viruses, or malicious code.</li>
              <li>Violates any applicable law or regulation.</li>
              <li>Impersonates any person or entity.</li>
              <li>Collects or solicits personal information from other users.</li>
            </ul>

            <h2>7. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use any robot, spider, or other automated device to access the Service.</li>
              <li>Resell, redistribute, or sublicense course content without written permission.</li>
              <li>Harass, threaten, or intimidate other users, instructors, or staff.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use the Service for any illegal or unauthorized purpose.</li>
              <li>Circumvent any technological protection measures.</li>
              <li>Share answers to quizzes or assessments that could undermine academic integrity.</li>
            </ul>

            <h2>8. Termination</h2>
            <p>We reserve the right to terminate or suspend your account immediately, without prior notice, for any violation of these Terms. Upon termination:</p>
            <ul>
              <li>Your right to access the Service ceases immediately.</li>
              <li>Sections 6 (Content), 9 (Disclaimer), 10 (Limitation of Liability), and 11 (Indemnification) survive termination.</li>
              <li>You may request account reactivation by contacting {COMPANY_EMAIL}.</li>
            </ul>
            <p>You may terminate your account at any time through your account settings or by contacting us. We will delete your personal data in accordance with our Privacy Policy.</p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. {COMPANY_NAME} MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
            <p>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. NO ADVICE OR INFORMATION OBTAINED BY YOU FROM US SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED IN THESE TERMS.</p>

            <h2>10. Limitation of Liability</h2>
            <p>IN NO EVENT SHALL {COMPANY_NAME}, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>
            <p>OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM THESE TERMS SHALL BE LIMITED TO THE GREATER OF: (A) $100 USD, OR (B) THE TOTAL FEES PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>

            <h2>11. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its affiliates, officers, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from:</p>
            <ul>
              <li>Your use of or access to the Service.</li>
              <li>Your violation of any term of this Agreement.</li>
              <li>Your violation of any third-party right, including intellectual property or privacy rights.</li>
              <li>Any content you submit, post, or share on the Service.</li>
            </ul>

            <h2>12. Governing Law and Dispute Resolution</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.</p>
            <p>Any dispute arising from these Terms shall be resolved exclusively through binding arbitration administered by the American Arbitration Association (AAA) in Wilmington, Delaware. Each party shall bear its own arbitration costs. This clause does not prevent either party from seeking injunctive relief in any court of competent jurisdiction.</p>

            <h2>13. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through a prominent notice on the Service at least thirty (30) days before they take effect. Non-material changes may be made without prior notice. Your continued use of the Service after changes take effect constitutes your acceptance of the modified Terms.</p>

            <h2>14. Severability</h2>
            <p>If any provision of these Terms is held to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>

            <h2>15. Waiver</h2>
            <p>The failure of {COMPANY_NAME} to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative of {COMPANY_NAME}.</p>

            <h2>16. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul>
              <li>Email: {COMPANY_EMAIL}</li>
              <li>Phone: {COMPANY_PHONE}</li>
              <li>Address: {COMPANY_ADDRESS}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
