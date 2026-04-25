// src/pages/Dashboard.jsx
import { useOutletContext, useNavigate } from 'react-router-dom'
import { StatsCard } from '../components/Common'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wrench, Truck, AlertTriangle, FileText, Droplets, Clock, TrendingUp, Bell } from 'lucide-react'
import { calculateOilStatus, calculateDocumentStatus } from '../utils/calculations'
import { formatDate } from '../utils/calculations'
import { useEffect, useState } from 'react'
import { getCollection } from '../firebase/firestore'
import { orderBy } from 'firebase/firestore'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { equipment = [], vehicles = [], documents = [], alerts = [] } = useOutletContext() || {}
  const navigate = useNavigate()
  const [recentMaintenance, setRecentMaintenance] = useState([])

  useEffect(() => {
    getCollection('maintenance_logs', [orderBy('createdAt', 'desc')]).then(logs => setRecentMaintenance(logs.slice(0, 5))).catch(() => {})
  }, [])

  const allItems = [...equipment, ...vehicles]
  const overdueOil = allItems.filter(i => {
    const s = calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading)
    return s.status === 'overdue'
  }).length
  const expiredDocs = documents.filter(d => calculateDocumentStatus(d.expiryDate).status === 'expired').length
  const urgentAlerts = alerts.filter(a => a.type === 'danger').length

  // Chart data
  const oilChartData = [
    { name: 'جيد', value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'ok').length },
    { name: 'قريب', value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'warning').length },
    { name: 'متجاوز', value: overdueOil },
    { name: 'غير محدد', value: allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'unknown').length },
  ].filter(d => d.value > 0)

  const docChartData = [
    { name: 'سارية', value: documents.filter(d => calculateDocumentStatus(d.expiryDate).status === 'ok').length },
    { name: 'تنتهي قريباً', value: documents.filter(d => ['warning','critical'].includes(calculateDocumentStatus(d.expiryDate).status)).length },
    { name: 'منتهية', value: expiredDocs },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm mt-0.5">نظرة عامة على المعدات والصيانة</p>
        </div>
        <div className="text-sm text-slate-500">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => navigate('/equipment')} className="cursor-pointer">
          <StatsCard title="المعدات" value={equipment.length} icon={Wrench} color="blue" subtitle="إجمالي المعدات" />
        </div>
        <div onClick={() => navigate('/vehicles')} className="cursor-pointer">
          <StatsCard title="السيارات" value={vehicles.length} icon={Truck} color="green" subtitle="إجمالي السيارات" />
        </div>
        <div onClick={() => navigate('/alerts')} className="cursor-pointer">
          <StatsCard title="تنبيهات عاجلة" value={urgentAlerts} icon={Bell} color={urgentAlerts > 0 ? 'red' : 'green'} subtitle="تحتاج متابعة" />
        </div>
        <div onClick={() => navigate('/documents')} className="cursor-pointer">
          <StatsCard title="مستندات منتهية" value={expiredDocs} icon={FileText} color={expiredDocs > 0 ? 'amber' : 'green'} subtitle="تحتاج تجديد" />
        </div>
      </div>

      {/* Alerts Banner */}
      {urgentAlerts > 0 && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-900/60 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="font-semibold text-red-300">
                  {urgentAlerts} تنبيه عاجل يحتاج إلى مراجعة فورية
                </div>
                <div className="text-sm text-red-500">
                  {alerts.filter(a => a.type === 'danger' && a.category === 'oil_change').length} تغيير زيت متجاوز •{' '}
                  {alerts.filter(a => a.type === 'danger' && a.category === 'document').length} مستند منتهي
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/alerts')} className="btn-danger text-sm">
              عرض التنبيهات
            </button>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oil Status Pie */}
        <div className="card">
          <h3 className="section-title mb-4">حالة زيت المعدات والسيارات</h3>
          {oilChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={oilChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {oilChartData.map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#ef4444','#64748b'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Documents Status */}
        <div className="card">
          <h3 className="section-title mb-4">حالة المستندات</h3>
          {docChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={docChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {docChartData.map((_, i) => <Cell key={i} fill={['#10b981','#f59e0b','#ef4444'][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">لا توجد مستندات</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Oil */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">تغيير الزيت المتجاوز</h3>
            <button onClick={() => navigate('/oil-changes')} className="text-sm text-primary-400 hover:text-primary-300">عرض الكل</button>
          </div>
          {allItems.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">✅ لا يوجد تغيير زيت متجاوز</div>
          ) : (
            <div className="space-y-2">
              {allItems
                .filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue')
                .map(item => {
                  const s = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)
                  const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-900/10 border border-red-700/20 rounded-lg">
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <span className="badge-red">{Math.abs(s.remaining)} {unit} زيادة</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Recent Maintenance */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">آخر سجلات الصيانة</h3>
            <button onClick={() => navigate('/maintenance')} className="text-sm text-primary-400 hover:text-primary-300">عرض الكل</button>
          </div>
          {recentMaintenance.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">لا توجد سجلات صيانة بعد</div>
          ) : (
            <div className="space-y-2">
              {recentMaintenance.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold text-white">{log.equipmentName}</div>
                    <div className="text-xs text-slate-500">{log.maintenanceType} • {formatDate(log.date)}</div>
                  </div>
                  {log.cost > 0 && (
                    <span className="text-sm font-semibold text-emerald-400">{Number(log.cost).toLocaleString()} ر.س</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
