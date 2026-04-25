// src/pages/OilChanges.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection } from '../firebase/firestore'
import { OilChangeModal, MeterReadingModal } from '../components/Equipment/MeterReadingForm'
import { OilStatusBadge, ProgressBar, SearchInput, EmptyState, LoadingSpinner } from '../components/Common'
import { calculateOilStatus } from '../utils/calculations'
import { Droplets, Gauge } from 'lucide-react'
import { formatDate } from '../utils/calculations'

export default function OilChanges() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const [oilLogs, setOilLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [oilTarget, setOilTarget] = useState(null)
  const [oilItemType, setOilItemType] = useState('equipment')
  const [meterTarget, setMeterTarget] = useState(null)
  const [meterItemType, setMeterItemType] = useState('equipment')
  const [activeTab, setActiveTab] = useState('status') // status | history

  useEffect(() => {
    const unsub = subscribeToCollection('oil_changes', data => {
      setOilLogs(data.sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
      setLoading(false)
    })
    return unsub
  }, [])

  const allItems = [
    ...equipment.map(e => ({...e, _type:'equipment'})),
    ...vehicles.map(v => ({...v, _type:'vehicle'})),
  ].filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || !search)

  const sorted = [...allItems].sort((a,b) => {
    const sa = calculateOilStatus(a.lastOilChangeReading, a.oilChangeInterval, a.currentReading)
    const sb = calculateOilStatus(b.lastOilChangeReading, b.oilChangeInterval, b.currentReading)
    const order = {overdue:0,warning:1,ok:2,unknown:3}
    return (order[sa.status]||3)-(order[sb.status]||3)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Droplets className="w-6 h-6 text-amber-400"/> تغيير الزيت</h1>
          <p className="text-slate-400 text-sm">{allItems.filter(i=>calculateOilStatus(i.lastOilChangeReading,i.oilChangeInterval,i.currentReading).status==='overdue').length} متجاوز الموعد</p>
        </div>
      </div>

      <div className="flex gap-2 bg-slate-900 p-1 rounded-xl w-fit">
        {[['status','حالة الزيت'],['history','سجل التغييرات']].map(([t,l])=>(
          <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab===t?'bg-primary-600 text-white':'text-slate-400 hover:text-white'}`}>{l}</button>
        ))}
      </div>

      {activeTab === 'status' && (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="بحث عن معدة أو سيارة..." />
          {sorted.length === 0 ? (
            <EmptyState icon={Droplets} title="لا توجد معدات" message="أضف معدات أو سيارات أولاً" />
          ) : (
            <div className="space-y-3">
              {sorted.map(item => {
                const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'
                const status = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                return (
                  <div key={item.id} className={`card border-2 ${status.status==='overdue'?'border-red-700/50':status.status==='warning'?'border-amber-600/40':'border-slate-700'}`}>
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
                        <div className={`font-bold ${status.remaining<=0?'text-red-400':status.percentage<=20?'text-amber-400':'text-emerald-400'}`}>
                          {status.remaining?.toLocaleString() ?? '—'}
                        </div>
                        <div className="text-slate-500">{unit}</div>
                      </div>
                    </div>
                    {item.oilChangeInterval > 0 && <div className="mt-2"><ProgressBar percentage={status.percentage} status={status.status}/></div>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>{setMeterTarget(item);setMeterItemType(item._type)}} className="btn-ghost text-xs flex-1 justify-center py-1.5">
                        <Gauge className="w-3.5 h-3.5"/> إدخال قراءة
                      </button>
                      <button onClick={()=>{setOilTarget(item);setOilItemType(item._type)}} className="btn-primary text-xs flex-1 justify-center py-1.5">
                        <Droplets className="w-3.5 h-3.5"/> تسجيل تغيير زيت
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {oilLogs.length === 0 ? (
            <EmptyState icon={Droplets} title="لا يوجد سجل تغييرات" message="سجلات تغيير الزيت ستظهر هنا" />
          ) : oilLogs.map(log => (
            <div key={log.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-amber-400"/>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{log.equipmentId}</div>
                  <div className="text-xs text-slate-500">{log.date} • {Number(log.reading).toLocaleString()}</div>
                </div>
              </div>
              {log.notes && <div className="text-xs text-slate-500 truncate max-w-[200px]">{log.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <OilChangeModal isOpen={!!oilTarget} onClose={()=>setOilTarget(null)} item={oilTarget} itemType={oilItemType} />
      <MeterReadingModal isOpen={!!meterTarget} onClose={()=>setMeterTarget(null)} item={meterTarget} itemType={meterItemType} />
    </div>
  )
}
