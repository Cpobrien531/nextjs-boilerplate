'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { FileDown, Printer, LogOut } from 'lucide-react'
import Link from 'next/link'

interface ExpenseRow {
  date: string
  vendor: string
  category: string
  amount: number
}

interface BudgetRow {
  categoryName: string
  month: number
  year: number
  budgetAmount: number
  amountSpent: number
}

interface ReportData {
  userName: string
  startDate: string
  endDate: string
  expenses: ExpenseRow[]
  budgetSummary: BudgetRow[]
}

export default function ExportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(todayStr)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  async function generateReport() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/export?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      if (json.success) {
        setReport(json.data)
      } else {
        setError(json.error ?? 'Failed to load report')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  async function handleCsvDownload() {
    const url = `/api/export/csv?startDate=${startDate}&endDate=${endDate}`
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${startDate}_to_${endDate}.csv`
    a.click()
  }

  async function handlePdfDownload() {
    if (!report) return
    const jsPDFModule = await import('jspdf')
    const autoTableModule = await import('jspdf-autotable')
    const jsPDF = jsPDFModule.default
    const autoTable = autoTableModule.default

    const doc = new jsPDF()
    const printedOn = format(new Date(), 'PPP')
    const rangeLabel = `${format(new Date(report.startDate + 'T00:00:00'), 'PPP')} – ${format(new Date(report.endDate + 'T00:00:00'), 'PPP')}`

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Expense Report', 14, 20)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Prepared for: ${report.userName}`, 14, 30)
    doc.text(`Date range: ${rangeLabel}`, 14, 37)
    doc.text(`Generated: ${printedOn}`, 14, 44)

    // Expense table
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Expense History', 14, 56)

    const total = report.expenses.reduce((s, e) => s + e.amount, 0)

    autoTable(doc, {
      startY: 60,
      head: [['Date', 'Vendor', 'Category', 'Amount']],
      body: [
        ...report.expenses.map((e) => [
          e.date,
          e.vendor,
          e.category,
          `$${e.amount.toFixed(2)}`,
        ]),
        ['', '', 'Total', `$${total.toFixed(2)}`],
      ],
      headStyles: { fillColor: [30, 64, 175] },
      foot: [],
      styles: { fontSize: 10 },
      columnStyles: { 3: { halign: 'right' } },
    })

    // Budget summary
    if (report.budgetSummary.length > 0) {
      const afterTable = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Budget Summary', 14, afterTable)

      autoTable(doc, {
        startY: afterTable + 4,
        head: [['Category', 'Period', 'Budget', 'Spent', 'Remaining']],
        body: report.budgetSummary.map((b) => {
          const remaining = b.budgetAmount - b.amountSpent
          const monthName = format(new Date(b.year, b.month - 1), 'MMM yyyy')
          return [
            b.categoryName,
            monthName,
            `$${b.budgetAmount.toFixed(2)}`,
            `$${b.amountSpent.toFixed(2)}`,
            remaining < 0
              ? `-$${Math.abs(remaining).toFixed(2)}`
              : `$${remaining.toFixed(2)}`,
          ]
        }),
        headStyles: { fillColor: [30, 64, 175] },
        styles: { fontSize: 10 },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
        },
      })
    }

    doc.save(`expense_report_${startDate}_to_${endDate}.pdf`)
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  const total = report?.expenses.reduce((s, e) => s + e.amount, 0) ?? 0

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Header — hidden when printing */}
          <div className="no-print flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold">Export Report</h1>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          {/* Controls — hidden when printing */}
          <div className="no-print rounded-lg border border-border bg-card p-6 mb-8">
            <h2 className="font-semibold mb-4">Select Date Range</h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : 'Generate Report'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>

          {report && (
            <>
              {/* Export action buttons */}
              <div className="no-print flex gap-3 mb-6">
                <button
                  onClick={handlePdfDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={handleCsvDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-accent transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  Download CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
              </div>

              {/* Report preview — visible on screen and when printing */}
              <div className="rounded-lg border border-border bg-card p-8">
                {/* Report header */}
                <div className="mb-8 border-b border-border pb-6">
                  <h2 className="text-2xl font-bold mb-1">Expense Report</h2>
                  <p className="text-muted-foreground">Prepared for: <span className="text-foreground font-medium">{report.userName}</span></p>
                  <p className="text-muted-foreground">
                    Date range:{' '}
                    <span className="text-foreground font-medium">
                      {format(new Date(report.startDate + 'T00:00:00'), 'PPP')} – {format(new Date(report.endDate + 'T00:00:00'), 'PPP')}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">Generated: {format(new Date(), 'PPPp')}</p>
                </div>

                {/* Expense table */}
                <h3 className="font-semibold text-lg mb-3">Expense History</h3>
                {report.expenses.length === 0 ? (
                  <p className="text-muted-foreground text-sm mb-8">No expenses in this date range.</p>
                ) : (
                  <table className="w-full text-sm mb-8">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-semibold">Date</th>
                        <th className="text-left py-2 pr-4 font-semibold">Vendor</th>
                        <th className="text-left py-2 pr-4 font-semibold">Category</th>
                        <th className="text-right py-2 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.expenses.map((e, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 pr-4 text-muted-foreground">{e.date}</td>
                          <td className="py-2 pr-4">{e.vendor}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{e.category}</td>
                          <td className="py-2 text-right font-medium">${e.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-3 font-semibold">Total</td>
                        <td className="pt-3 text-right font-bold">${total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* Budget summary */}
                {report.budgetSummary.length > 0 && (
                  <>
                    <h3 className="font-semibold text-lg mb-3">Budget Summary</h3>
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col className="w-[35%]" />
                        <col className="w-[18%]" />
                        <col className="w-[15%]" />
                        <col className="w-[15%]" />
                        <col className="w-[17%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-semibold">Category</th>
                          <th className="text-left py-2 pr-4 font-semibold">Period</th>
                          <th className="text-right py-2 pr-4 font-semibold">Budget</th>
                          <th className="text-right py-2 pr-4 font-semibold">Spent</th>
                          <th className="text-right py-2 font-semibold">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.budgetSummary.map((b, i) => {
                          const remaining = b.budgetAmount - b.amountSpent
                          const isOver = remaining < 0
                          return (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 pr-4 truncate">{b.categoryName}</td>
                              <td className="py-2 pr-4 text-muted-foreground">
                                {format(new Date(b.year, b.month - 1), 'MMM yyyy')}
                              </td>
                              <td className="py-2 pr-4 text-right">${b.budgetAmount.toFixed(2)}</td>
                              <td className="py-2 pr-4 text-right">${b.amountSpent.toFixed(2)}</td>
                              <td className={`py-2 text-right font-medium ${isOver ? 'text-red-500' : 'text-green-600'}`}>
                                {isOver ? `-$${Math.abs(remaining).toFixed(2)}` : `$${remaining.toFixed(2)}`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
