import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-white text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">AI Expense Tracker</h1>
          <p className="text-xl opacity-90">
            Track your expenses intelligently with AI-powered categorization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-3">Smart Categorization</h3>
            <p className="text-gray-600">
              AI automatically categorizes your expenses based on name and description
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-3">Budget Management</h3>
            <p className="text-gray-600">
              Set monthly budgets per category and get alerts when you&apos;re near limits
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-3">Easy Export</h3>
            <p className="text-gray-600">
              Export your expenses to CSV for further analysis and reporting
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-white text-blue-500 px-8 py-3 rounded font-bold hover:bg-gray-100 mr-4"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-block bg-blue-700 text-white px-8 py-3 rounded font-bold hover:bg-blue-800"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
