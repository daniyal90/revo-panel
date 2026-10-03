import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/register"
          className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Register
        </Link>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-6 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Information Collection</h2>
                <p className="text-slate-400">
                  Revo Panel collects information you provide directly, including your name, email address, company name, and WhatsApp number when you register for an account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Use of Information</h2>
                <p className="text-slate-400">
                  We use your information to provide and improve our services, process payments, communicate with you, and comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
                <p className="text-slate-400">
                  We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
                <p className="text-slate-400">
                  We do not sell, trade, or rent your personal identification information to others. We may share your information with trusted third parties who assist us in operating our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. SMS Traffic Data</h2>
                <p className="text-slate-400">
                  We collect and process SMS traffic data including message content, sender information, and delivery status for the purpose of monetization and quality assurance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Payment Information</h2>
                <p className="text-slate-400">
                  Payment information is processed through secure third-party payment processors. We do not store complete credit card or banking information on our servers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
                <p className="text-slate-400">
                  We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. You can configure your browser to refuse cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
                <p className="text-slate-400">
                  You have the right to access, correct, or delete your personal data. You may also opt-out of certain communications at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Services</h2>
                <p className="text-slate-400">
                  Our platform may contain links to third-party websites. We are not responsible for the privacy practices of such third-party sites.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Privacy Policy</h2>
                <p className="text-slate-400">
                  Revo Panel reserves the right to update this privacy policy at any time. We will notify users of any material changes via email or through our platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
                <p className="text-slate-400">
                  If you have any questions about this Privacy Policy, please contact us via WhatsApp or Telegram.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-slate-500 text-sm">
                Last updated: October 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
