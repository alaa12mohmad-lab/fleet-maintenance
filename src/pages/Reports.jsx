// src/pages/Reports.jsx
import { useState, useEffect } from 'react'
import { getCollection } from '../firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { LoadingSpinner } from '../components/Common'
import { BarChart2, FileDown, Printer } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { calculateOilStatus, calculateDocumentStatus } from '../utils/calculations'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const TOOLTIP_STYLE = { background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#f1f5f9', fontSize:'12px' }

// ─── PDF Generator ─────────────────────────────────────────────
const generatePDF = async (equipment, vehicles, logs, documents, year) => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // ── Header ──────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Fleet & Equipment Maintenance Report', pageW / 2, 15, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Year: ${year}   |   Generated: ${new Date().toLocaleDateString('en-GB')}`, pageW / 2, 25, { align: 'center' })

  let y = 45

  // ── Summary Cards ────────────────────────────────────────────
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 15, y)
  y += 8

  const totalCost = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0)
  const expiredDocs = documents.filter(d => calculateDocumentStatus(d.expiryDate).status === 'expired').length
  const overdueOil = [...equipment, ...vehicles].filter(i => {
    const s = calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading)
    return s.status === 'overdue'
  }).length

  const cards = [
    { label: 'Equipment', value: equipment.length },
    { label: 'Vehicles', value: vehicles.length },
    { label: 'Maintenance Logs', value: logs.length },
    { label: 'Total Cost (SAR)', value: totalCost.toLocaleString() },
    { label: 'Expired Docs', value: expiredDocs },
    { label: 'Overdue Oil Change', value: overdueOil },
  ]

  const cardW = (pageW - 30) / 3
  cards.forEach((card, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 15 + col * (cardW + 5)
    const cardY = y + row * 22

    const bgColor = card.label.includes('Expired') || card.label.includes('Overdue')
      ? [254, 242, 242] : [239, 246, 255]
    doc.setFillColor(...bgColor)
    doc.roundedRect(x, cardY, cardW, 18, 2, 2, 'F')
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(String(card.value), x + cardW / 2, cardY + 10, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(card.label, x + cardW / 2, cardY + 16, { align: 'center' })
  })
  y += 50

  // ── Equipment Table ──────────────────────────────────────────
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Equipment Status', 15, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [['Name', 'Code', 'Driver', 'Reading', 'Oil Status', 'Next Oil Change']],
    body: [...equipment, ...vehicles].map(item => {
      const unit = item.meterType === 'hours' ? 'hrs' : 'km'
      const s = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
      const status = s.status === 'overdue' ? 'OVERDUE' : s.status === 'warning' ? 'WARNING' : 'OK'
      const next = s.nextChangeAt ? `${s.nextChangeAt.toLocaleString()} ${unit}` : '—'
      return [
        item.name || '—',
        item.code || '—',
        item.driver || '—',
        `${(item.currentReading || 0).toLocaleString()} ${unit}`,
        status,
        next,
      ]
    }),
    styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: {
        fontStyle: 'bold',
        textColor: (data) => {
          const val = data.cell.raw
          return val === 'OVERDUE' ? [220, 38, 38] : val === 'WARNING' ? [217, 119, 6] : [5, 150, 105]
        }
      }
    },
    didParseCell: (data) => {
      if (data.column.index === 4) {
        const val = data.cell.raw
        if (val === 'OVERDUE') data.cell.styles.textColor = [220, 38, 38]
        else if (val === 'WARNING') data.cell.styles.textColor = [217, 119, 6]
        else data.cell.styles.textColor = [5, 150, 105]
      }
    },
    margin: { left: 15, right: 15 },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── Maintenance Log Table ────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Maintenance Log', 15, y)
  y += 5

  const yearLogs = logs.filter(l => l.date && new Date(l.date).getFullYear() === year)

  autoTable(doc, {
    startY: y,
    head: [['Equipment', 'Type', 'Date', 'Reading', 'Cost (SAR)', 'Workshop']],
    body: yearLogs.slice(0, 50).map(l => [
      l.equipmentName || '—',
      l.maintenanceType || '—',
      l.date || '—',
      l.meterReading ? Number(l.meterReading).toLocaleString() : '—',
      l.cost ? Number(l.cost).toLocaleString() : '0',
      l.workshop || '—',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    foot: [['', '', '', 'Total Cost:', yearLogs.reduce((s,l) => s+(Number(l.cost)||0), 0).toLocaleString() + ' SAR', '']],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── Documents Table ──────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Documents Status', 15, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [['Document', 'Type', 'Linked To', 'Issue Date', 'Expiry Date', 'Status']],
    body: documents.map(d => {
      const s = calculateDocumentStatus(d.expiryDate)
      const status = s.status === 'expired' ? 'EXPIRED'
        : s.status === 'critical' ? 'CRITICAL'
        : s.status === 'warning' ? 'WARNING' : 'VALID'
      return [d.name || '—', d.docType || '—', d.linkedName || '—', d.issueDate || '—', d.expiryDate || '—', status]
    }),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.column.index === 5) {
        const val = data.cell.raw
        if (val === 'EXPIRED' || val === 'CRITICAL') data.cell.styles.textColor = [220, 38, 38]
        else if (val === 'WARNING') data.cell.styles.textColor = [217, 119, 6]
        else data.cell.styles.textColor = [5, 150, 105]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 15, right: 15 },
  })

  // ── Footer ───────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Fleet & Equipment Management System  |  Page ${i} of ${pageCount}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  doc.save(`Fleet-Report-${year}.pdf`)
}

// ─── Main Component ────────────────────────────────────────────
export default function Reports() {
  const { equipment = [], vehicles = [], documents = [] } = useOutletContext() || {}
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear]       = useState(new Date().getFullYear())
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getCollection('maintenance_logs', [orderBy('createdAt', 'desc')])
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const monthlyCost = MONTHS_AR.map((month, idx) => {
    const monthLogs = logs.filter(l => {
      if (!l.date) return false
      const d = new Date(l.date)
      return d.getFullYear() === year && d.getMonth() === idx
    })
    return {
      month,
      'تكلفة': monthLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0),
      'صيانات': monthLogs.length,
    }
  })

  const totalCost    = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0)
  const thisMonthCost = logs.filter(l => l.date && new Date(l.date).getMonth() === new Date().getMonth())
    .reduce((s, l) => s + (Number(l.cost) || 0), 0)

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      await generatePDF(equipment, vehicles, logs, documents, year)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary-400" /> التقارير
          </h1>
          <p className="text-slate-400 text-sm">تقارير الصيانة والتكاليف</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-auto">
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary text-sm"
          >
            <FileDown className="w-4 h-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الصيانات', value: logs.length, color: 'text-blue-400' },
          { label: 'إجمالي التكاليف', value: `${totalCost.toLocaleString()} ر.س`, color: 'text-emerald-400' },
          { label: 'تكلفة هذا الشهر', value: `${thisMonthCost.toLocaleString()} ر.س`, color: 'text-amber-400' },
          { label: 'متوسط تكلفة الصيانة', value: logs.length ? `${Math.round(totalCost / logs.length).toLocaleString()} ر.س` : '—', color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="card">
        <h3 className="section-title mb-4">التكاليف الشهرية — {year}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyCost} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v.toLocaleString()} ر.س`, 'التكلفة']} />
            <Bar dataKey="تكلفة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">عدد الصيانات الشهرية</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyCost} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="صيانات" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fleet Summary */}
      <div className="card">
        <h3 className="section-title mb-4">إجمالي الأسطول</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'المعدات', value: equipment.length, emoji: '⚙️' },
            { label: 'السيارات', value: vehicles.length, emoji: '🚗' },
            { label: 'إجمالي الأسطول', value: equipment.length + vehicles.length, emoji: '🏗️' },
            { label: 'سجلات الصيانة', value: logs.length, emoji: '📋' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 p-4 rounded-xl">
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
