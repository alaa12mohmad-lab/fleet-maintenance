// src/pages/Reports.jsx
import { useState, useEffect } from 'react'
import { getCollection } from '../firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { LoadingSpinner } from '../components/Common'
import { BarChart2, Download, TrendingUp, DollarSign } from 'lucide-react'
import * as XLSX from 'xlsx'
import { orderBy } from 'firebase/firestore'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const TOOLTIP_STYLE = { background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', color:'#f1f5f9', fontSize:'12px' }

export default function Reports() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly') // monthly | weekly
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    getCollection('maintenance_logs', [orderBy('createdAt','desc')]).then(data => {
      setLogs(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Monthly cost data
  const monthlyCost = MONTHS_AR.map((month, idx) => {
    const monthLogs = logs.filter(l => {
      if (!l.date) return false
      const d = new Date(l.date)
      return d.getFullYear() === year && d.getMonth() === idx
    })
    return {
      month,
      تكلفة: monthLogs.reduce((s,l) => s + (Number(l.cost)||0), 0),
      صيانات: monthLogs.length,
    }
  })

  // By type
  const byType = logs.reduce((acc, l) => {
    if (!l.maintenanceType) return acc
    acc[l.maintenanceType] = (acc[l.maintenanceType] || 0) + 1
    return acc
  }, {})
  const typeData = Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name, count]) => ({name, عدد: count}))

  const totalCost = logs.reduce((s,l) => s+(Number(l.cost)||0), 0)
  const thisMonth = new Date().getMonth()
  const thisMonthCost = logs.filter(l => l.date && new Date(l.date).getMonth() === thisMonth).reduce((s,l)=>s+(Number(l.cost)||0),0)

  const exportReport = () => {
    const data = monthlyCost.map(m => ({ 'الشهر': m.month, 'عدد الصيانات': m.صيانات, 'التكلفة الإجمالية': m.تكلفة }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'التقرير الشهري')
    XLSX.writeFile(wb, `تقرير-الصيانة-${year}.xlsx`)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary-400"/> التقارير</h1>
          <p className="text-slate-400 text-sm">تقارير الصيانة والتكاليف</p>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={e=>setYear(Number(e.target.value))} className="input-field w-auto">
            {[2022,2023,2024,2025].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={exportReport} className="btn-secondary text-sm">
            <Download className="w-4 h-4"/> تصدير Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الصيانات', value: logs.length, color: 'text-blue-400' },
          { label: 'إجمالي التكاليف', value: `${totalCost.toLocaleString()} ر.س`, color: 'text-emerald-400' },
          { label: 'تكلفة هذا الشهر', value: `${thisMonthCost.toLocaleString()} ر.س`, color: 'text-amber-400' },
          { label: 'متوسط تكلفة الصيانة', value: logs.length ? `${Math.round(totalCost/logs.length).toLocaleString()} ر.س` : '—', color: 'text-purple-400' },
        ].map((s,i) => (
          <div key={i} className="card text-center">
            <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
            <div className="text-sm text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Cost Bar Chart */}
      <div className="card">
        <h3 className="section-title mb-4">التكاليف الشهرية - {year}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyCost} margin={{top:5,right:5,bottom:5,left:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{fill:'#94a3b8',fontSize:11}} />
            <YAxis tick={{fill:'#94a3b8',fontSize:11}} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v)=>[`${v.toLocaleString()} ر.س`,'التكلفة']} />
            <Bar dataKey="تكلفة" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Count Line Chart */}
        <div className="card">
          <h3 className="section-title mb-4">عدد الصيانات الشهرية</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyCost} margin={{top:5,right:5,bottom:5,left:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{fill:'#94a3b8',fontSize:10}} />
              <YAxis tick={{fill:'#94a3b8',fontSize:10}} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="صيانات" stroke="#10b981" strokeWidth={2} dot={{fill:'#10b981',r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="card">
          <h3 className="section-title mb-4">الصيانات حسب النوع</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} layout="vertical" margin={{top:5,right:5,bottom:5,left:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{fill:'#94a3b8',fontSize:10}} />
                <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:10}} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="عدد" fill="#8b5cf6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Equipment Stats */}
      <div className="card">
        <h3 className="section-title mb-4">إجمالي الأسطول</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'المعدات', value: equipment.length, emoji: '⚙️' },
            { label: 'السيارات', value: vehicles.length, emoji: '🚗' },
            { label: 'إجمالي الأسطول', value: equipment.length + vehicles.length, emoji: '🏗️' },
            { label: 'سجلات الصيانة', value: logs.length, emoji: '📋' },
          ].map((s,i) => (
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
