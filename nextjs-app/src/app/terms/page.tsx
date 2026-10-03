import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
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
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-6 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                <p className="text-slate-400">
                  By accessing and using Revo Panel SMS Monetization Platform, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Use License</h2>
                <p className="text-slate-400">
                  Permission is granted to temporarily download one copy of the materials on Revo Panel for personal, non-commercial transitory viewing only.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
                <p className="text-slate-400">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. SMS Traffic Monetization</h2>
                <p className="text-slate-400">
                  Users must comply with all applicable laws and regulations regarding SMS traffic. Any fraudulent activity will result in immediate account termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Payouts and Payments</h2>
                <p className="text-slate-400">
                  Payouts are processed weekly on Tuesdays for accounts that have reached the minimum threshold of $50. Payment methods include USDT-TRC20, Wise, and Bank Wire.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Termination</h2>
                <p className="text-slate-400">
                  Revo Panel reserves the right to terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
                <p className="text-slate-400">
                  Revo Panel shall not be liable for any indirect, incidental, special, consequential or punitive damages arising out of your access or use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Governing Law</h2>
                <p className="text-slate-400">
                  These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Revo Panel operates.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Contact Information</h2>
                <p className="text-slate-400">
                  For any questions regarding these terms, please contact us via WhatsApp or Telegram.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
                <p className="text-slate-400">
                  Revo Panel reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of any changes.
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
