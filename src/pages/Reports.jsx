// src/pages/Reports.jsx
import { useState, useEffect, useRef } from 'react'
import { getCollection } from '../firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { LoadingSpinner } from '../components/Common'
import { BarChart2, FileDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { orderBy } from 'firebase/firestore'
import { calculateOilStatus, calculateDocumentStatus } from '../utils/calculations'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

const TOOLTIP_STYLE = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px'
}

// ─── PDF Template ──────────────────────────────────────────────
function PDFTemplate({ equipment, vehicles, logs, documents, year, type }) {
  const allItems  = [...equipment, ...vehicles]
  const yearLogs  = logs.filter(l => l.date && new Date(l.date).getFullYear() === year)
  const totalCost = yearLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0)

  const expiredDocs = documents.filter(d =>
    calculateDocumentStatus(d.expiryDate).status === 'expired')
  const overdueOil = allItems.filter(i =>
    calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue')

  const today = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const typeLabel = {
    summary: 'التقرير الشامل',
    maintenance: 'تقرير الصيانة',
    documents: 'تقرير المستندات',
    oil: 'تقرير تغيير الزيت',
  }[type] || 'التقرير'

  return (
    <div dir="rtl" style={{
      fontFamily: 'Cairo, Arial, sans-serif',
      background: '#fff',
      color: '#1e293b',
      width: '794px',
      minHeight: '1123px',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #2563eb)',
        padding: '32px 40px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
              نظام إدارة الأسطول والمعدات
            </div>
            <div style={{ fontSize: '13px', opacity: '0.85' }}>
              {typeLabel} — عام {year}
            </div>
          </div>
          <div style={{ textAlign: 'left', fontSize: '12px', opacity: '0.85' }}>
            <div>تاريخ الإصدار</div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>{today}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 40px' }}>

        {/* Summary Cards */}
        {(type === 'summary' || type === 'oil') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '15px', fontWeight: '800', marginBottom: '14px',
              color: '#1e40af', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px'
            }}>
              📊 ملخص الأسطول
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { label: 'إجمالي المعدات', value: equipment.length, bg: '#dbeafe', border: '#93c5fd', color: '#1e40af', icon: '⚙️' },
                { label: 'إجمالي السيارات', value: vehicles.length, bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '🚗' },
                { label: 'سجلات الصيانة', value: yearLogs.length, bg: '#fef9c3', border: '#fde047', color: '#854d0e', icon: '🔧' },
                { label: 'إجمالي التكاليف', value: `${totalCost.toLocaleString()} ر.س`, bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '💰' },
                { label: 'تغيير زيت متجاوز', value: overdueOil.length, bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '🔴' },
                { label: 'مستندات منتهية', value: expiredDocs.length, bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '📄' },
              ].map((card, i) => (
                <div key={i} style={{
                  background: card.bg,
                  border: `2px solid ${card.border}`,
                  borderRadius: '10px',
                  padding: '14px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{card.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment / Oil Table */}
        {(type === 'summary' || type === 'oil') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '15px', fontWeight: '800', marginBottom: '12px',
              color: '#1e40af', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px'
            }}>
              🚛 حالة تغيير الزيت — المعدات والسيارات
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ background: '#1e40af', color: '#fff' }}>
                  {['الاسم','الكود','السائق','العداد الحالي','آخر تغيير','المتبقي','الحالة'].map(h => (
                    <th key={h} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, i) => {
                  const unit = item.meterType === 'hours' ? 'س' : 'كم'
                  const s = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                  const labels = { overdue: 'متجاوز', warning: 'قريب', ok: 'جيد', unknown: 'غير محدد' }
                  const colors = { overdue: '#dc2626', warning: '#d97706', ok: '#16a34a', unknown: '#64748b' }
                  const bgs    = { overdue: '#fee2e2', warning: '#fef9c3', ok: '#dcfce7', unknown: '#f1f5f9' }
                  return (
                    <tr key={item.id} style={{ background: i%2===0?'#f8fafc':'#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '7px 6px', fontWeight: '600' }}>{item.name}</td>
                      <td style={{ padding: '7px 6px', color: '#64748b' }}>{item.code||'—'}</td>
                      <td style={{ padding: '7px 6px' }}>{item.driver||'—'}</td>
                      <td style={{ padding: '7px 6px' }}>{(item.currentReading||0).toLocaleString()} {unit}</td>
                      <td style={{ padding: '7px 6px' }}>{(item.lastOilChangeReading||0).toLocaleString()} {unit}</td>
                      <td style={{ padding: '7px 6px', fontWeight: '600', color: s.remaining < 0 ? '#dc2626' : '#16a34a' }}>
                        {s.remaining !== null ? `${s.remaining.toLocaleString()} ${unit}` : '—'}
                      </td>
                      <td style={{ padding: '7px 6px' }}>
                        <span style={{
                          background: bgs[s.status]||'#f1f5f9',
                          color: colors[s.status]||'#64748b',
                          padding: '2px 8px', borderRadius: '20px',
                          fontWeight: '700', fontSize: '9px',
                        }}>
                          {labels[s.status]||'—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Maintenance Table */}
        {(type === 'summary' || type === 'maintenance') && yearLogs.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '15px', fontWeight: '800', marginBottom: '12px',
              color: '#7c3aed', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px'
            }}>
              🔧 سجل الصيانة — {year}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ background: '#7c3aed', color: '#fff' }}>
                  {['المعدة','نوع الصيانة','التاريخ','قراءة العداد','التكلفة (ر.س)','الورشة'].map(h => (
                    <th key={h} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearLogs.slice(0, 30).map((log, i) => (
                  <tr key={log.id} style={{ background: i%2===0?'#f8fafc':'#fff', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '7px 6px', fontWeight: '600' }}>{log.equipmentName||'—'}</td>
                    <td style={{ padding: '7px 6px' }}>
                      <span style={{
                        background: '#ede9fe', color: '#7c3aed',
                        padding: '2px 7px', borderRadius: '20px', fontSize: '9px', fontWeight: '600'
                      }}>
                        {log.maintenanceType||'—'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 6px', color: '#64748b' }}>{log.date||'—'}</td>
                    <td style={{ padding: '7px 6px', color: '#64748b' }}>
                      {log.meterReading ? Number(log.meterReading).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '7px 6px', fontWeight: '700', color: '#16a34a' }}>
                      {log.cost ? Number(log.cost).toLocaleString() : '0'}
                    </td>
                    <td style={{ padding: '7px 6px', color: '#64748b' }}>{log.workshop||'—'}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f1f5f9', fontWeight: '800' }}>
                  <td colSpan={4} style={{ padding: '9px 6px' }}>إجمالي التكاليف</td>
                  <td style={{ padding: '9px 6px', color: '#16a34a', fontSize: '13px' }}>
                    {totalCost.toLocaleString()} ر.س
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Documents Table */}
        {(type === 'summary' || type === 'documents') && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '15px', fontWeight: '800', marginBottom: '12px',
              color: '#059669', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px'
            }}>
              📄 المستندات والوثائق
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ background: '#059669', color: '#fff' }}>
                  {['المستند','النوع','مرتبط بـ','تاريخ الإصدار','تاريخ الانتهاء','الحالة'].map(h => (
                    <th key={h} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => {
                  const s = calculateDocumentStatus(doc.expiryDate)
                  const labels = { expired:'منتهية', critical:'حرجة', warning:'تنتهي قريباً', ok:'سارية', unknown:'غير محدد' }
                  const colors = { expired:'#dc2626', critical:'#dc2626', warning:'#d97706', ok:'#16a34a', unknown:'#64748b' }
                  const bgs    = { expired:'#fee2e2', critical:'#fee2e2', warning:'#fef9c3', ok:'#dcfce7', unknown:'#f1f5f9' }
                  return (
                    <tr key={doc.id} style={{ background: i%2===0?'#f8fafc':'#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '7px 6px', fontWeight: '600' }}>{doc.name}</td>
                      <td style={{ padding: '7px 6px', color: '#64748b' }}>{doc.docType||'—'}</td>
                      <td style={{ padding: '7px 6px', color: '#64748b' }}>{doc.linkedName||'—'}</td>
                      <td style={{ padding: '7px 6px', color: '#64748b' }}>{doc.issueDate||'—'}</td>
                      <td style={{ padding: '7px 6px', color: '#64748b' }}>{doc.expiryDate||'—'}</td>
                      <td style={{ padding: '7px 6px' }}>
                        <span style={{
                          background: bgs[s.status]||'#f1f5f9',
                          color: colors[s.status]||'#64748b',
                          padding: '2px 8px', borderRadius: '20px',
                          fontWeight: '700', fontSize: '9px',
                        }}>
                          {labels[s.status]||'—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          borderTop: '2px solid #e2e8f0',
          paddingTop: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          color: '#94a3b8',
          fontSize: '10px',
        }}>
          <span>نظام إدارة الأسطول والمعدات — Fleet Management System</span>
          <span>تاريخ الإصدار: {today}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────
export default function Reports() {
  const { equipment = [], vehicles = [], documents = [] } = useOutletContext() || {}
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [year, setYear]           = useState(new Date().getFullYear())
  const [exporting, setExporting] = useState(false)
  const [pdfType, setPdfType]     = useState('summary')
  const pdfRef = useRef(null)

  useEffect(() => {
    getCollection('maintenance_logs', [orderBy('createdAt', 'desc')])
      .then(data => { setLogs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allItems   = [...equipment, ...vehicles]
  const yearLogs   = logs.filter(l => l.date && new Date(l.date).getFullYear() === year)
  const totalCost  = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0)
  const overdueOil = allItems.filter(i =>
    calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length
  const expiredDocs = documents.filter(d =>
    calculateDocumentStatus(d.expiryDate).status === 'expired').length

  const monthlyCost = MONTHS_AR.map((month, idx) => {
    const ml = logs.filter(l => {
      if (!l.date) return false
      const d = new Date(l.date)
      return d.getFullYear() === year && d.getMonth() === idx
    })
    return {
      month,
      'تكلفة': ml.reduce((s, l) => s + (Number(l.cost) || 0), 0),
      'صيانات': ml.length,
    }
  })

  const oilData = [
    { name: 'جيد',      value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'ok').length },
    { name: 'قريب',     value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'warning').length },
    { name: 'متجاوز',   value: overdueOil },
    { name: 'غير محدد', value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'unknown').length },
  ].filter(d => d.value > 0)

  const handleExportPDF = async () => {
    if (!pdfRef.current) return
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { default: jsPDF } = await import('jspdf')
      const canvas  = await html2canvas(pdfRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW   = pdf.internal.pageSize.getWidth()
      const pageH   = pdf.internal.pageSize.getHeight()
      const imgH    = (canvas.height * pageW) / canvas.width
      const pages   = Math.ceil(imgH / pageH)
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -(i * pageH), pageW, imgH)
      }
      const names = { summary:'الشامل', maintenance:'الصيانة', documents:'المستندات', oil:'الزيت' }
      pdf.save(`تقرير-${names[pdfType]}-${year}.pdf`)
    } catch (err) {
      console.error(err)
      alert('حدث خطأ في التصدير')
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
            <BarChart2 className="w-6 h-6 text-primary-400" />
            التقارير
          </h1>
          <p className="text-slate-400 text-sm">تقارير الصيانة والتكاليف والمستندات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-auto">
            {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={pdfType} onChange={e => setPdfType(e.target.value)} className="input-field w-auto">
            <option value="summary">تقرير شامل</option>
            <option value="maintenance">تقرير الصيانة</option>
            <option value="documents">تقرير المستندات</option>
            <option value="oil">تقرير الزيت</option>
          </select>
          <button onClick={handleExportPDF} disabled={exporting} className="btn-primary text-sm">
            <FileDown className="w-4 h-4" />
            {exporting ? 'جاري التصدير...' : 'تصدير PDF'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الصيانات', value: logs.length, color: 'text-blue-400' },
          { label: `تكاليف ${year}`, value: `${yearLogs.reduce((s,l)=>s+(Number(l.cost)||0),0).toLocaleString()} ر.س`, color: 'text-emerald-400' },
          { label: 'تغيير زيت متجاوز', value: overdueOil, color: overdueOil > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'مستندات منتهية', value: expiredDocs, color: expiredDocs > 0 ? 'text-amber-400' : 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">التكاليف الشهرية — {year}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCost} margin={{ top:5, right:5, bottom:5, left:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:10 }} />
              <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v.toLocaleString()} ر.س`, 'التكلفة']} />
              <Bar dataKey="تكلفة" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">حالة الزيت</h3>
          {oilData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={oilData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {oilData.map((_, i) => (
                    <Cell key={i} fill={['#10b981','#f59e0b','#ef4444','#64748b'][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend formatter={v => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-500">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* عدد الصيانات */}
      <div className="card">
        <h3 className="section-title mb-4">عدد الصيانات الشهرية — {year}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyCost} margin={{ top:5, right:5, bottom:5, left:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill:'#94a3b8', fontSize:10 }} />
            <YAxis tick={{ fill:'#94a3b8', fontSize:10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="صيانات" stroke="#10b981" strokeWidth={2} dot={{ fill:'#10b981', r:3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border border-red-700/30">
          <h3 className="text-base font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> تغيير زيت متجاوز
          </h3>
          {allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> لا يوجد تأخير
            </div>
          ) : (
            <div className="space-y-2">
              {allItems
                .filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue')
                .map(item => {
                  const s    = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                  const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'
                  return (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-red-900/20 rounded-lg">
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                      <span className="badge-red">تجاوز {Math.abs(s.remaining).toLocaleString()} {unit}</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        <div className="card border border-amber-700/30">
          <h3 className="text-base font-bold text-amber-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> مستندات تنتهي قريباً
          </h3>
          {documents.filter(d => ['warning','critical','expired'].includes(calculateDocumentStatus(d.expiryDate).status)).length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> جميع المستندات سارية
            </div>
          ) : (
            <div className="space-y-2">
              {documents
                .filter(d => ['warning','critical','expired'].includes(calculateDocumentStatus(d.expiryDate).status))
                .slice(0, 5)
                .map(doc => {
                  const s = calculateDocumentStatus(doc.expiryDate)
                  return (
                    <div key={doc.id} className="flex justify-between items-center p-2 bg-amber-900/20 rounded-lg">
                      <span className="text-sm font-semibold text-white truncate max-w-[60%]">{doc.name}</span>
                      <span className={s.status === 'expired' ? 'badge-red' : 'badge-yellow'}>
                        {s.status === 'expired' ? 'منتهية' : `${s.daysLeft} يوم`}
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef}>
          <PDFTemplate
            equipment={equipment}
            vehicles={vehicles}
            logs={logs}
            documents={documents}
            year={year}
            type={pdfType}
          />
        </div>
      </div>

    </div>
  )
}
