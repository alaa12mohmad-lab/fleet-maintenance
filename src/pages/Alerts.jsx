// src/pages/Alerts.jsx
import { useOutletContext } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Bell, Droplets, FileText, Wrench } from 'lucide-react'
import { EmptyState } from '../components/Common'

const CATEGORY_CONFIG = {
  oil_change: { icon: Droplets, label: 'تغيير الزيت', color: 'amber' },
  document: { icon: FileText, label: 'مستند', color: 'blue' },
  maintenance: { icon: Wrench, label: 'صيانة', color: 'purple' },
}

const TYPE_STYLES = {
  danger: {
    bg: 'bg-red-900/20 border-red-700/40',
    icon: 'bg-red-900/40 text-red-400',
    badge: 'badge-red',
    label: 'عاجل',
  },
  warning: {
    bg: 'bg-amber-900/15 border-amber-700/30',
    icon: 'bg-amber-900/40 text-amber-400',
    badge: 'badge-yellow',
    label: 'تحذير',
  },
}

export default function Alerts() {
  const { alerts = [] } = useOutletContext() || {}

  const dangerAlerts = alerts.filter(a => a.type === 'danger')
  const warningAlerts = alerts.filter(a => a.type === 'warning')

  const AlertItem = ({ alert }) => {
    const styles = TYPE_STYLES[alert.type] || TYPE_STYLES.warning
    const cat = CATEGORY_CONFIG[alert.category] || {}
    const CatIcon = cat.icon || Bell

    return (
      <div className={`flex items-start gap-4 p-4 rounded-xl border-2 ${styles.bg}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
          <CatIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-white text-sm">{alert.title}</span>
            <span className={styles.badge}>{styles.label}</span>
          </div>
          <p className="text-sm text-slate-400">{alert.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white">🔔 التنبيهات</h1>
          <p className="text-slate-400 text-sm">
            {dangerAlerts.length} عاجل • {warningAlerts.length} تحذير
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">لا توجد تنبيهات</h3>
          <p className="text-slate-400 text-sm">جميع المعدات والمستندات في وضع جيد</p>
        </div>
      ) : (
        <>
          {dangerAlerts.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> تنبيهات عاجلة ({dangerAlerts.length})
              </h2>
              <div className="space-y-3">
                {dangerAlerts.map((a, i) => <AlertItem key={i} alert={a} />)}
              </div>
            </div>
          )}
          {warningAlerts.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" /> تحذيرات ({warningAlerts.length})
              </h2>
              <div className="space-y-3">
                {warningAlerts.map((a, i) => <AlertItem key={i} alert={a} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
