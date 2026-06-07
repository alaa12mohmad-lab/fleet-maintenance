// src/pages/OilChanges.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection } from '../firebase/firestore'
import { OilChangeModal, MeterReadingModal } from '../components/Equipment/MeterReadingForm'
import { OilStatusBadge, ProgressBar, SearchInput, EmptyState, LoadingSpinner } from '../components/Common'
import { calculateOilStatus } from '../utils/calculations'
import { Droplets, Gauge, Clock, CalendarDays, ChevronDown, ChevronUp, FileText, X } from 'lucide-react'

// ─── تصدير PDF عربي عبر Print ────────────────────────────────
function exportOilPDF(allItems, oilLogs, itemMap) {
  const now = new Date().toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' })
  const overdue = allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length
  const warning = allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'warning').length
  const ok      = allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'ok').length
  const unknown = allItems.length - overdue - warning - ok

  const statusLabel = s =>
    s === 'overdue' ? '<span style="color:#ef4444;font-weight:700">⛔ متجاوز</span>' :
    s === 'warning' ? '<span style="color:#f59e0b;font-weight:700">⚠️ قريب</span>'   :
    s === 'ok'      ? '<span style="color:#22c55e;font-weight:700">✅ جيد</span>'    :
    '<span style="color:#94a3b8">— غير محدد</span>'

  const summaryRows = allItems.map(item => {
    const unit   = item.meterType === 'hours' ? 'ساعة' : 'كم'
    const status = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
    const nextAt = item.oilChangeInterval
      ? (Number(item.lastOilChangeReading||0) + Number(item.oilChangeInterval)).toLocaleString('ar-SA') + ' ' + unit
      : '—'
    const remaining = status.remaining != null
      ? `<span style="color:${status.remaining<=0?'#ef4444':status.percentage<=20?'#f59e0b':'#22c55e'};font-weight:600">${status.remaining.toLocaleString('ar-SA')} ${unit}</span>`
      : '—'
    return `
      <tr>
        <td>${item._type==='vehicle'?'🚗':'⚙️'} ${item.name}</td>
        <td>${item.code || item.plateNumber || '—'}</td>
        <td>${item._type==='vehicle'?'سيارة':'معدة'}</td>
        <td>${(item.lastOilChangeReading||0).toLocaleString('ar-SA')} ${unit}</td>
        <td>${(item.currentReading||0).toLocaleString('ar-SA')} ${unit}</td>
        <td>${remaining}</td>
        <td style="color:#fbbf24;font-weight:600">${nextAt}</td>
        <td>${item.lastOilChangeDate || '—'}</td>
        <td>${statusLabel(status.status)}</td>
      </tr>`
  }).join('')

  const historyRows = oilLogs.map(log => {
    const item = itemMap[log.equipmentId]
    const unit = item?.meterType === 'hours' ? 'ساعة' : 'كم'
    const nextAt = item?.oilChangeInterval
      ? (Number(log.reading) + Number(item.oilChangeInterval)).toLocaleString('ar-SA') + ' ' + unit
      : '—'
    const status = item ? calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading) : null
    return `
      <tr>
        <td>${item?._type==='vehicle'?'🚗':'⚙️'} ${item?.name || log.equipmentId}</td>
        <td>${item?.code || item?.plateNumber || '—'}</td>
        <td>${item?._type==='vehicle'?'سيارة':'معدة'}</td>
        <td>${log.date || '—'}</td>
        <td style="font-weight:600">${Number(log.reading).toLocaleString('ar-SA')} ${unit}</td>
        <td style="color:#fbbf24;font-weight:600">${nextAt}</td>
        <td style="color:#94a3b8">${log.notes || '—'}</td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>تقرير تغيير الزيت</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      direction: rtl;
      font-size: 13px;
    }

    /* ── غلاف ── */
    .cover {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #78350f 100%);
      color: #fff;
      padding: 40px 50px 30px;
      margin-bottom: 30px;
    }
    .cover-title {
      font-size: 32px;
      font-weight: 800;
      color: #fbbf24;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .cover-sub {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .stats-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .stat-box {
      background: rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 14px 20px;
      min-width: 110px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .stat-num { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .stat-overdue .stat-num { color: #ef4444; }
    .stat-warning .stat-num { color: #f59e0b; }
    .stat-ok      .stat-num { color: #22c55e; }
    .stat-unknown .stat-num { color: #64748b; }
    .stat-total   .stat-num { color: #fbbf24; }

    /* ── أقسام ── */
    .section { padding: 0 50px 30px; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 3px solid #f59e0b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title span { font-size: 20px; }

    /* ── جدول ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    thead tr {
      background: #1e293b;
      color: #fff;
    }
    thead th {
      padding: 10px 10px;
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
    }
    tbody tr { border-bottom: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #fef3c7; }
    tbody td { padding: 9px 10px; vertical-align: middle; }

    /* ── فاصل صفحة ── */
    .page-break { page-break-before: always; }

    /* ── footer ── */
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      padding: 20px 50px;
      border-top: 1px solid #e2e8f0;
      margin-top: 20px;
    }

    @media print {
      body { font-size: 11px; }
      .cover { margin-bottom: 20px; }
      .section { padding: 0 20px 20px; }
    }
  </style>
</head>
<body>

  <!-- غلاف -->
  <div class="cover">
    <div class="cover-title">🛢️ تقرير تغيير الزيت</div>
    <div class="cover-sub">نظام إدارة الأسطول والمعدات &nbsp;·&nbsp; ${now}</div>
    <div class="stats-row">
      <div class="stat-box stat-total">
        <div class="stat-num">${allItems.length}</div>
        <div class="stat-label">إجمالي المعدات</div>
      </div>
      <div class="stat-box stat-overdue">
        <div class="stat-num">${overdue}</div>
        <div class="stat-label">⛔ متجاوز الموعد</div>
      </div>
      <div class="stat-box stat-warning">
        <div class="stat-num">${warning}</div>
        <div class="stat-label">⚠️ يقترب الموعد</div>
      </div>
      <div class="stat-box stat-ok">
        <div class="stat-num">${ok}</div>
        <div class="stat-label">✅ حالة جيدة</div>
      </div>
      <div class="stat-box stat-unknown">
        <div class="stat-num">${unknown}</div>
        <div class="stat-label">— غير محدد</div>
      </div>
      <div class="stat-box" style="min-width:130px">
        <div class="stat-num" style="font-size:20px;color:#94a3b8">${oilLogs.length}</div>
        <div class="stat-label">إجمالي السجلات</div>
      </div>
    </div>
  </div>

  <!-- ملخص حالة المعدات -->
  <div class="section">
    <div class="section-title"><span>📊</span> ملخص حالة الزيت لجميع المعدات</div>
    <table>
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الكود</th>
          <th>النوع</th>
          <th>آخر تغيير</th>
          <th>القراءة الحالية</th>
          <th>المتبقي</th>
          <th>الموعد القادم</th>
          <th>تاريخ آخر تغيير</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  <!-- سجل التغييرات -->
  <div class="section page-break">
    <div class="section-title"><span>📋</span> سجل جميع تغييرات الزيت</div>
    <table>
      <thead>
        <tr>
          <th>المعدة / السيارة</th>
          <th>الكود</th>
          <th>النوع</th>
          <th>تاريخ التغيير</th>
          <th>قراءة العداد</th>
          <th>الموعد القادم</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>${historyRows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px">لا توجد سجلات</td></tr>'}</tbody>
    </table>
  </div>

  <div class="footer">
    نظام إدارة الأسطول والمعدات &nbsp;·&nbsp; تم إنشاؤه بتاريخ ${now}
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

// ─── Component ────────────────────────────────────────────────
export default function OilChanges() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const [oilLogs, setOilLogs]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [filterType, setFilterType]       = useState('all')
  const [filterStatus, setFilterStatus]   = useState('all')
  const [oilTarget, setOilTarget]         = useState(null)
  const [oilItemType, setOilItemType]     = useState('equipment')
  const [meterTarget, setMeterTarget]     = useState(null)
  const [meterItemType, setMeterItemType] = useState('equipment')
  const [activeTab, setActiveTab]         = useState('status')
  const [expanded, setExpanded]           = useState({})

  useEffect(() => {
    const unsub = subscribeToCollection('oil_changes', data => {
      setOilLogs(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setLoading(false)
    })
    return unsub
  }, [])

  const allItemsBase = [
    ...equipment.map(e => ({ ...e, _type: 'equipment' })),
    ...vehicles.map(v => ({ ...v, _type: 'vehicle' })),
  ]
  const itemMap = {}
  allItemsBase.forEach(i => { itemMap[i.id] = i })

  const logsByItem = {}
  oilLogs.forEach(log => {
    if (!logsByItem[log.equipmentId]) logsByItem[log.equipmentId] = []
    logsByItem[log.equipmentId].push(log)
  })

  const filtered = allItemsBase
    .filter(i => {
      if (filterType !== 'all' && i._type !== filterType) return false
      const s = calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading)
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (search && !i.name?.toLowerCase().includes(search.toLowerCase()) &&
          !(i.code || i.plateNumber || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const order = { overdue: 0, warning: 1, ok: 2, unknown: 3 }
      const sa = calculateOilStatus(a.lastOilChangeReading, a.oilChangeInterval, a.currentReading)
      const sb = calculateOilStatus(b.lastOilChangeReading, b.oilChangeInterval, b.currentReading)
      return (order[sa.status] || 3) - (order[sb.status] || 3)
    })

  const overdueCount = allItemsBase.filter(i =>
    calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length
  const warningCount = allItemsBase.filter(i =>
    calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'warning').length
  const hasFilters = filterType !== 'all' || filterStatus !== 'all' || search

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-amber-400" /> تغيير الزيت
          </h1>
          <div className="flex gap-3 mt-1 flex-wrap">
            {overdueCount > 0 && <span className="text-xs text-red-400 font-semibold">⛔ {overdueCount} متجاوز الموعد</span>}
            {warningCount > 0 && <span className="text-xs text-amber-400 font-semibold">⚠️ {warningCount} يقترب الموعد</span>}
            <span className="text-xs text-slate-400">{allItemsBase.length} إجمالي</span>
          </div>
        </div>
        <button
          onClick={() => exportOilPDF(allItemsBase, oilLogs, itemMap)}
          className="btn-ghost text-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-amber-400" /> طباعة / PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900 p-1 rounded-xl w-fit">
        {[['status','حالة الزيت'],['history','سجل التغييرات']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab===t ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
            }`}>{l}</button>
        ))}
      </div>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
          {[['all','الكل'],['equipment','⚙️ معدات'],['vehicle','🚗 سيارات']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterType(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                filterType===v ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg">
          {[['all','الكل'],['overdue','⛔ متجاوز'],['warning','⚠️ قريب'],['ok','✅ جيد'],['unknown','— غير محدد']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                filterStatus===v ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>
        {hasFilters && (
          <button onClick={() => { setFilterType('all'); setFilterStatus('all'); setSearch('') }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors">
            <X className="w-3 h-3" /> مسح الفلاتر
          </button>
        )}
      </div>

      {/* ══ TAB: حالة الزيت ══ */}
      {activeTab === 'status' && (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الكود..." />
          <div className="text-xs text-slate-500 px-1">{filtered.length} من {allItemsBase.length} نتيجة</div>
          {filtered.length === 0 ? (
            <EmptyState icon={Droplets} title="لا توجد نتائج" message="جرّب تغيير الفلاتر" />
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const unit     = item.meterType === 'hours' ? 'ساعة' : 'كم'
                const status   = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                const nextAt   = Number(item.lastOilChangeReading||0) + Number(item.oilChangeInterval||0)
                const itemLogs = logsByItem[item.id] || []
                const isOpen   = expanded[item.id]
                return (
                  <div key={item.id} className={`card border-2 ${
                    status.status==='overdue' ? 'border-red-700/50' :
                    status.status==='warning' ? 'border-amber-600/40' : 'border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item._type==='vehicle'?'🚗':'⚙️'}</span>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.code || item.plateNumber}</div>
                        </div>
                      </div>
                      <OilStatusBadge item={item} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">آخر تغيير</div>
                        <div className="text-white font-semibold">{(item.lastOilChangeReading||0).toLocaleString()}</div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">الحالية</div>
                        <div className="text-white font-semibold">{(item.currentReading||0).toLocaleString()}</div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">المتبقي</div>
                        <div className={`font-bold ${
                          status.remaining<=0 ? 'text-red-400' :
                          status.percentage<=20 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {status.remaining!=null ? status.remaining.toLocaleString() : '—'}
                        </div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                    </div>
                    {item.oilChangeInterval > 0 && (
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" /> الموعد القادم:
                          <span className={`font-bold mr-1 ${status.remaining<=0?'text-red-400':'text-amber-300'}`}>
                            {nextAt.toLocaleString()} {unit}
                          </span>
                        </span>
                        {item.lastOilChangeDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> {item.lastOilChangeDate}
                          </span>
                        )}
                      </div>
                    )}
                    {item.oilChangeInterval > 0 && (
                      <div className="mt-1"><ProgressBar percentage={status.percentage} status={status.status} /></div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { setMeterTarget(item); setMeterItemType(item._type) }}
                        className="btn-ghost text-xs flex-1 justify-center py-1.5">
                        <Gauge className="w-3.5 h-3.5" /> إدخال قراءة
                      </button>
                      <button onClick={() => { setOilTarget(item); setOilItemType(item._type) }}
                        className="btn-primary text-xs flex-1 justify-center py-1.5">
                        <Droplets className="w-3.5 h-3.5" /> تسجيل تغيير زيت
                      </button>
                    </div>
                    {itemLogs.length > 0 && (
                      <div className="mt-2 border-t border-slate-700 pt-2">
                        <button onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white w-full">
                          <Clock className="w-3 h-3" /> {itemLogs.length} تغيير مسجّل
                          {isOpen ? <ChevronUp className="w-3 h-3 mr-auto" /> : <ChevronDown className="w-3 h-3 mr-auto" />}
                        </button>
                        {isOpen && (
                          <div className="mt-2 space-y-1">
                            {itemLogs.map(log => (
                              <div key={log.id} className="flex items-center justify-between text-xs bg-slate-900 rounded-lg px-3 py-1.5">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" /> {log.date || '—'}
                                </span>
                                <span className="text-white font-semibold">{Number(log.reading).toLocaleString()} {unit}</span>
                                {log.notes && <span className="text-slate-500 truncate max-w-[120px]">{log.notes}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ══ TAB: سجل التغييرات ══ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(logsByItem)
              .filter(([itemId]) => {
                const item = itemMap[itemId]
                if (!item) return false
                if (filterType !== 'all' && item._type !== filterType) return false
                return true
              })
              .map(([itemId, logs]) => {
                const item    = itemMap[itemId]
                const lastLog = logs[0]
                const status  = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                return (
                  <div key={itemId} className="card text-center space-y-1">
                    <div className="text-lg">{item._type==='vehicle'?'🚗':'⚙️'}</div>
                    <div className="text-sm font-bold text-white truncate">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.code || item.plateNumber}</div>
                    <div className="text-2xl font-black text-amber-400">{logs.length}</div>
                    <div className="text-xs text-slate-500">تغيير مسجّل</div>
                    <div className={`text-xs font-semibold ${
                      status.status==='overdue' ? 'text-red-400' :
                      status.status==='warning' ? 'text-amber-400' :
                      status.status==='ok'      ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {status.status==='overdue'?'⛔ متجاوز':status.status==='warning'?'⚠️ قريب':status.status==='ok'?'✅ جيد':'— غير محدد'}
                    </div>
                    {lastLog && <div className="text-xs text-slate-500">آخر تغيير: {lastLog.date||'—'}</div>}
                  </div>
                )
              })}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> جميع التغييرات — من الأحدث للأقدم
            </h2>
            {oilLogs.length === 0 ? (
              <EmptyState icon={Droplets} title="لا يوجد سجل" message="سجلات تغيير الزيت ستظهر هنا" />
            ) : (
              <div className="relative">
                <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-slate-700" />
                <div className="space-y-3 pr-10">
                  {oilLogs
                    .filter(log => {
                      const item = itemMap[log.equipmentId]
                      if (!item) return true
                      if (filterType !== 'all' && item._type !== filterType) return false
                      return true
                    })
                    .map(log => {
                      const item   = itemMap[log.equipmentId]
                      const unit   = item?.meterType==='hours' ? 'ساعة' : 'كم'
                      const nextAt = item?.oilChangeInterval
                        ? (Number(log.reading)+Number(item.oilChangeInterval)).toLocaleString()+' '+unit : '—'
                      return (
                        <div key={log.id} className="relative">
                          <div className="absolute -right-[2.15rem] top-3 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                          <div className="card">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                                  <Droplets className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">
                                    {item?.name || log.equipmentId}
                                    <span className="mr-2 text-xs">{item?._type==='vehicle'?'🚗':'⚙️'}</span>
                                  </div>
                                  <div className="text-xs text-slate-500">{item?.code||item?.plateNumber||''}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                                <CalendarDays className="w-3 h-3" /> {log.date||'—'}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-slate-900 rounded-lg p-2 text-center">
                                <div className="text-slate-500 mb-0.5">قراءة العداد وقت التغيير</div>
                                <div className="text-white font-bold text-base">{Number(log.reading).toLocaleString()}</div>
                                <div className="text-slate-500">{unit}</div>
                              </div>
                              <div className="bg-slate-900 rounded-lg p-2 text-center">
                                <div className="text-slate-500 mb-0.5">الموعد القادم المتوقع</div>
                                <div className="text-amber-300 font-bold text-base">{nextAt}</div>
                              </div>
                            </div>
                            {log.notes && (
                              <div className="mt-2 text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-1.5">
                                📝 {log.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <OilChangeModal    isOpen={!!oilTarget}   onClose={() => setOilTarget(null)}   item={oilTarget}   itemType={oilItemType} />
      <MeterReadingModal isOpen={!!meterTarget} onClose={() => setMeterTarget(null)} item={meterTarget} itemType={meterItemType} />
    </div>
  )
}
