'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold">💰 ExpenseTracker</div>
        <div className="space-x-4">
          <Link href="/login" className="px-4 py-2 hover:text-blue-400 transition">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Smart Expense Tracking for Freelancers & Small Business Owners
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Stop wasting hours on expense management. Capture receipts, auto-categorize spending, get budget alerts, and export to your accountant—all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition text-lg">
            Start Free Trial
          </Link>
          <Link href="/login" className="px-8 py-3 border border-blue-400 rounded-lg hover:border-blue-300 font-semibold transition text-lg">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-bold mb-3">Receipt Capture</h3>
            <p className="text-slate-300">
              Snap a photo of your receipts on the go. We extract the date, vendor, and amount—so you never lose a deduction.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-3">AI Auto-Categorization</h3>
            <p className="text-slate-300">
              Our AI learns your spending patterns and suggests the right category automatically. Less time categorizing, more time growing your business.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-xl font-bold mb-3">Quick Entry</h3>
            <p className="text-slate-300">
              Add expenses in under 10 seconds. Amount, category, done. Perfect for when you're at a parking meter or coffee shop.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold mb-3">Client & Project Tags</h3>
            <p className="text-slate-300">
              Tag expenses by client or project. See per-client spending and bill back expenses with ease.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="text-xl font-bold mb-3">Budget Alerts</h3>
            <p className="text-slate-300">
              Set monthly budgets per category. Get notified when you're approaching limits so you stay in control.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3">Export for Tax Time</h3>
            <p className="text-slate-300">
              Generate clean CSV/Excel exports by category and date range. Ready for your accountant or tax prep.
            </p>
          </div>

          {/* Feature 7 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-xl font-bold mb-3">Easy Editing</h3>
            <p className="text-slate-300">
              Made a mistake? Edit any expense field anytime. Amount, category, date—complete control.
            </p>
          </div>

          {/* Feature 8 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-3">Dashboard Analytics</h3>
            <p className="text-slate-300">
              See your spending at a glance. Total spent, monthly breakdown, and budget status in real-time.
            </p>
          </div>

          {/* Feature 9 */}
          <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
            <p className="text-slate-300">
              Your data is encrypted and secure. We never share your expense info with third parties.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-slate-800 rounded-lg border border-slate-700">
        <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">1</div>
            <h3 className="font-bold mb-2">Sign Up</h3>
            <p className="text-slate-300">Create your free account in seconds</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">2</div>
            <h3 className="font-bold mb-2">Add Categories</h3>
            <p className="text-slate-300">Set up your expense categories with budgets</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">3</div>
            <h3 className="font-bold mb-2">Log Expenses</h3>
            <p className="text-slate-300">Capture receipts or add expenses on the go</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">4</div>
            <h3 className="font-bold mb-2">Export & Analyze</h3>
            <p className="text-slate-300">Download reports for your accountant</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-8">Stop Losing Money on Forgotten Deductions</h2>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Join freelancers and small business owners who are saving 2-3 hours per month with smart expense tracking.
        </p>
        <Link href="/register" className="inline-block px-10 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition text-lg">
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-20 py-8 text-center text-slate-400">
        <p>&copy; 2026 ExpenseTracker. Built for freelancers and small business owners.</p>
      </footer>
    </div>
  );
}