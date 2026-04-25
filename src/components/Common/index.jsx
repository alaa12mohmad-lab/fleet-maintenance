// src/components/Common/index.jsx
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react'
import { calculateOilStatus, calculateDocumentStatus } from '../../utils/calculations'

// ─── Loading Spinner ───────────────────────────────────────────
export const LoadingSpinner = ({ message = 'جاري التحميل...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    <p className="text-slate-400 text-sm">{message}</p>
  </div>
)

export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center animate-pulse">
        <span className="text-white text-2xl font-bold">F</span>
      </div>
      <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
      <p className="text-slate-400">جاري تحميل النظام...</p>
    </div>
  </div>
)

// ─── Modal ─────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div className="modal-backdrop animate-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-container ${sizeClasses[size]} w-full`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────
export const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message, type = 'danger' }) => {
  if (!isOpen) return null
  return (
    <div className="modal-backdrop animate-in">
      <div className="modal-container max-w-sm">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            type === 'danger' ? 'bg-red-900/40' : 'bg-amber-900/40'
          }`}>
            <AlertTriangle className={`w-7 h-7 ${type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onCancel} className="btn-secondary flex-1">إلغاء</button>
            <button onClick={onConfirm} className={`flex-1 font-semibold px-4 py-2 rounded-lg transition-all ${
              type === 'danger' ? 'btn-danger' : 'btn-primary'
            }`}>تأكيد</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────
export const OilStatusBadge = ({ item }) => {
  const { status, remaining, label } = calculateOilStatus(
    item.lastOilChangeReading, item.oilChangeInterval, item.currentReading
  )
  const unit = item.meterType === 'hours' ? 'س' : 'كم'
  const classes = {
    overdue: 'badge-red',
    warning: 'badge-yellow',
    ok: 'badge-green',
    unknown: 'badge-blue',
  }
  return (
    <span className={classes[status] || 'badge-blue'}>
      {remaining !== null ? `${label} (${remaining > 0 ? '+' : ''}${remaining} ${unit})` : label}
    </span>
  )
}

export const DocStatusBadge = ({ expiryDate }) => {
  const { status, daysLeft } = calculateDocumentStatus(expiryDate)
  if (status === 'expired') return <span className="badge-red">منتهية ({Math.abs(daysLeft)} يوم)</span>
  if (status === 'critical') return <span className="badge-red">تنتهي خلال {daysLeft} يوم</span>
  if (status === 'warning') return <span className="badge-yellow">تنتهي خلال {daysLeft} يوم</span>
  if (status === 'ok') return <span className="badge-green">سارية ({daysLeft} يوم)</span>
  return <span className="badge-blue">غير محدد</span>
}

// ─── Pagination ────────────────────────────────────────────────
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
      >السابق</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            page === currentPage ? 'bg-primary-600 text-white' : 'btn-ghost'
          }`}
        >{page}</button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
      >التالي</button>
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────
export const ProgressBar = ({ percentage, status }) => {
  const colors = {
    ok: 'bg-emerald-500',
    warning: 'bg-amber-500',
    overdue: 'bg-red-500',
    unknown: 'bg-slate-500',
  }
  return (
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colors[status] || colors.unknown}`}
        style={{ width: `${Math.max(2, percentage)}%` }}
      />
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
      {Icon && <Icon className="w-8 h-8 text-slate-500" />}
    </div>
    <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm mb-4">{message}</p>
    {action}
  </div>
)

// ─── Search Input ──────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'بحث...' }) => (
  <div className="relative">
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pr-10"
    />
  </div>
)

// ─── Stats Card ────────────────────────────────────────────────
export const StatsCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend }) => {
  const colors = {
    blue: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
    green: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
    amber: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
    red: 'bg-red-900/40 text-red-400 border-red-700/40',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
  }
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-semibold text-slate-300">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  )
}
