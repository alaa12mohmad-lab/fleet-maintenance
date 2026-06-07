// src/pages/OilChanges.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection } from '../firebase/firestore'
import { OilChangeModal, MeterReadingModal } from '../components/Equipment/MeterReadingForm'
import { OilStatusBadge, ProgressBar, SearchInput, EmptyState, LoadingSpinner } from '../components/Common'
import { calculateOilStatus, formatDate } from '../utils/calculations'
import { Droplets, Gauge, Clock, CalendarDays, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function OilChanges() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const [oilLogs, setOilLogs]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [oilTarget, setOilTarget]   = useState(null)
  const [oilItemType, setOilItemType] = useState('equipment')
  const [meterTarget, setMeterTarget] = useState(null)
  const [meterItemType, setMeterItemType] = useState('equipment')
  const [activeTab, setActiveTab]   = useState('status')
  const [expanded, setExpanded]     = useState({}) // itemId -> boolean

  useEffect(() => {
    const unsub = subscribeToCollection('oil_changes', data => {
      setOilLogs(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setLoading(false)
    })
    return unsub
  }, [])

  // ─── بناء map: itemId → اسم المعدة ───────────────────────────
  const itemMap = {}
  ;[...equipment.map(e => ({ ...e, _type: 'equipment' })),
    ...vehicles.map(v => ({ ...v, _type: 'vehicle' }))]
    .forEach(i => { itemMap[i.id] = i })

  // ─── تجميع السجلات حسب المعدة ────────────────────────────────
  const logsByItem = {}
  oilLogs.forEach(log => {
    if (!logsByItem[log.equipmentId]) logsByItem[log.equipmentId] = []
    logsByItem[log.equipmentId].push(log)
  })

  // ─── قائمة المعدات مرتبة حسب الحالة ─────────────────────────
  const allItems = [
    ...equipment.map(e => ({ ...e, _type: 'equipment' })),
    ...vehicles.map(v => ({ ...v, _type: 'vehicle' })),
  ].filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()))

  const sorted = [...allItems].sort((a, b) => {
    const sa = calculateOilStatus(a.lastOilChangeReading, a.oilChangeInterval, a.currentReading)
    const sb = calculateOilStatus(b.lastOilChangeReading, b.oilChangeInterval, b.currentReading)
    const order = { overdue: 0, warning: 1, ok: 2, unknown: 3 }
    return (order[sa.status] || 3) - (order[sb.status] || 3)
  })

  const overdueCount = allItems.filter(i =>
    calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue'
  ).length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-6 h-6 text-amber-400" /> تغيير الزيت
          </h1>
          <p className="text-slate-400 text-sm">{overdueCount} متجاوز الموعد</p>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-2 bg-slate-900 p-1 rounded-xl w-fit">
        {[['status', 'حالة الزيت'], ['history', 'سجل التغييرات']].map(([t, l]) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: حالة الزيت
      ══════════════════════════════════════════ */}
      {activeTab === 'status' && (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="بحث عن معدة أو سيارة..." />
          {sorted.length === 0 ? (
            <EmptyState icon={Droplets} title="لا توجد معدات" message="أضف معدات أو سيارات أولاً" />
          ) : (
            <div className="space-y-3">
              {sorted.map(item => {
                const unit   = item.meterType === 'hours' ? 'ساعة' : 'كم'
                const status = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                const nextReading = (Number(item.lastOilChangeReading || 0) + Number(item.oilChangeInterval || 0))
                const itemLogs = logsByItem[item.id] || []
                const isOpen = expanded[item.id]

                return (
                  <div
                    key={item.id}
                    className={`card border-2 ${
                      status.status === 'overdue'  ? 'border-red-700/50' :
                      status.status === 'warning'  ? 'border-amber-600/40' :
                      'border-slate-700'
                    }`}
                  >
                    {/* ── رأس البطاقة ── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item._type === 'vehicle' ? '🚗' : '⚙️'}</span>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.code || item.plateNumber}</div>
                        </div>
                      </div>
                      <OilStatusBadge item={item} />
                    </div>

                    {/* ── أرقام ── */}
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">آخر تغيير</div>
                        <div className="text-white font-semibold">{(item.lastOilChangeReading || 0).toLocaleString()}</div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">الحالية</div>
                        <div className="text-white font-semibold">{(item.currentReading || 0).toLocaleString()}</div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg">
                        <div className="text-slate-500 mb-0.5">المتبقي</div>
                        <div className={`font-bold ${
                          status.remaining <= 0         ? 'text-red-400' :
                          status.percentage <= 20       ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {status.remaining != null ? status.remaining.toLocaleString() : '—'}
                        </div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                    </div>

                    {/* ── الموعد القادم ── */}
                    {item.oilChangeInterval > 0 && (
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400 px-1">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3" />
                          الموعد القادم عند:
                          <span className={`font-bold ml-1 ${status.remaining <= 0 ? 'text-red-400' : 'text-amber-300'}`}>
                            {nextReading.toLocaleString()} {unit}
                          </span>
                        </span>
                        {item.lastOilChangeDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {item.lastOilChangeDate}
                          </span>
                        )}
                      </div>
                    )}

                    {item.oilChangeInterval > 0 && (
                      <div className="mt-1">
                        <ProgressBar percentage={status.percentage} status={status.status} />
                      </div>
                    )}

                    {/* ── أزرار ── */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => { setMeterTarget(item); setMeterItemType(item._type) }}
                        className="btn-ghost text-xs flex-1 justify-center py-1.5"
                      >
                        <Gauge className="w-3.5 h-3.5" /> إدخال قراءة
                      </button>
                      <button
                        onClick={() => { setOilTarget(item); setOilItemType(item._type) }}
                        className="btn-primary text-xs flex-1 justify-center py-1.5"
                      >
                        <Droplets className="w-3.5 h-3.5" /> تسجيل تغيير زيت
                      </button>
                    </div>

                    {/* ── مصغّر تاريخ التغييرات ── */}
                    {itemLogs.length > 0 && (
                      <div className="mt-2 border-t border-slate-700 pt-2">
                        <button
                          onClick={() => setExpanded(p => ({ ...p, [item.id]: !p[item.id] }))}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white w-full"
                        >
                          <Clock className="w-3 h-3" />
                          {itemLogs.length} تغيير مسجّل
                          {isOpen ? <ChevronUp className="w-3 h-3 mr-auto" /> : <ChevronDown className="w-3 h-3 mr-auto" />}
                        </button>
                        {isOpen && (
                          <div className="mt-2 space-y-1">
                            {itemLogs.map((log, idx) => (
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

      {/* ══════════════════════════════════════════
          TAB: سجل التغييرات
      ══════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* ── ملخص عدد التغييرات لكل معدة ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(logsByItem).map(([itemId, logs]) => {
              const item = itemMap[itemId]
              if (!item) return null
              const lastLog = logs[0]
              const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'
              const status = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
              return (
                <div key={itemId} className="card text-center space-y-1">
                  <div className="text-lg">{item._type === 'vehicle' ? '🚗' : '⚙️'}</div>
                  <div className="text-sm font-bold text-white truncate">{item.name}</div>
                  <div className="text-2xl font-black text-amber-400">{logs.length}</div>
                  <div className="text-xs text-slate-500">تغيير مسجّل</div>
                  <div className={`text-xs font-semibold mt-1 ${
                    status.status === 'overdue' ? 'text-red-400' :
                    status.status === 'warning' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {status.status === 'overdue' ? '⚠️ متجاوز' :
                     status.status === 'warning' ? '🟡 قريب' : '✅ جيد'}
                  </div>
                  {lastLog && (
                    <div className="text-xs text-slate-500">آخر تغيير: {lastLog.date || '—'}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── التايم لاين الكامل ── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> جميع التغييرات — من الأحدث للأقدم
            </h2>
            {oilLogs.length === 0 ? (
              <EmptyState icon={Droplets} title="لا يوجد سجل تغييرات" message="سجلات تغيير الزيت ستظهر هنا" />
            ) : (
              <div className="relative">
                {/* خط التايم لاين */}
                <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-slate-700" />
                <div className="space-y-3 pr-10">
                  {oilLogs.map(log => {
                    const item = itemMap[log.equipmentId]
                    const unit = item?.meterType === 'hours' ? 'ساعة' : 'كم'
                    const nextReading = item
                      ? Number(log.reading) + Number(item.oilChangeInterval || 0)
                      : null

                    return (
                      <div key={log.id} className="relative">
                        {/* نقطة التايم لاين */}
                        <div className="absolute -right-[2.15rem] top-3 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900" />
                        <div className="card">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            {/* معلومات المعدة */}
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                                <Droplets className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">
                                  {item?.name || log.equipmentId}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {item?.code || item?.plateNumber || ''}
                                  {item && <span className="mr-1">{item._type === 'vehicle' ? '🚗' : '⚙️'}</span>}
                                </div>
                              </div>
                            </div>

                            {/* التاريخ */}
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded-lg">
                              <CalendarDays className="w-3 h-3" />
                              {log.date || '—'}
                            </div>
                          </div>

                          {/* أرقام */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-900 rounded-lg p-2 text-center">
                              <div className="text-slate-500 mb-0.5">قراءة العداد وقت التغيير</div>
                              <div className="text-white font-bold text-base">{Number(log.reading).toLocaleString()}</div>
                              <div className="text-slate-500">{unit}</div>
                            </div>
                            <div className="bg-slate-900 rounded-lg p-2 text-center">
                              <div className="text-slate-500 mb-0.5">الموعد القادم المتوقع</div>
                              <div className="text-amber-300 font-bold text-base">
                                {nextReading != null ? nextReading.toLocaleString() : '—'}
                              </div>
                              <div className="text-slate-500">{unit}</div>
                            </div>
                          </div>

                          {/* ملاحظات */}
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

      <OilChangeModal  isOpen={!!oilTarget}   onClose={() => setOilTarget(null)}   item={oilTarget}   itemType={oilItemType} />
      <MeterReadingModal isOpen={!!meterTarget} onClose={() => setMeterTarget(null)} item={meterTarget} itemType={meterItemType} />
    </div>
  )
}
