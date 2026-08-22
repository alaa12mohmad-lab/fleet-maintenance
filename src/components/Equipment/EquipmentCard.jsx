// src/components/Equipment/EquipmentCard.jsx
import { calculateOilStatus } from '../../utils/calculations'
import { OilStatusBadge, ProgressBar } from '../Common'
import { Gauge, Droplets, Wrench, Edit2, Trash2, MoreVertical, MapPin, FileText, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../../utils/calculations'

export default function EquipmentCard({
  item, itemType, onEdit, onDelete,
  onMeterReading, onOilChange, onMaintenance,
  onViewDocs, onViewMaintenance,
  canEdit, canDelete,
  docsCount = 0, maintenanceCount = 0,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'
  const oilStatus = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, item.currentReading)

  const typeIcon = itemType === 'vehicle' ? '🚗' : '⚙️'
  const statusColor = {
    ok: 'border-emerald-700/30',
    warning: 'border-amber-600/50',
    overdue: 'border-red-600/60',
    unknown: 'border-slate-700',
  }[oilStatus.status]

  return (
    <div className={`card border-2 ${statusColor} transition-all hover:shadow-lg hover:shadow-black/20 relative`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{typeIcon}</div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {item.code && <span className="text-xs text-slate-500 font-mono">{item.code}</span>}
              {item.plateNumber && (
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {item.plateNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-1.5">
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <button onClick={() => { onMeterReading(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Gauge className="w-4 h-4" /> إدخال قراءة عداد
                </button>
                <button onClick={() => { onOilChange(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Droplets className="w-4 h-4" /> تسجيل تغيير زيت
                </button>
                <button onClick={() => { onMaintenance(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                  <Wrench className="w-4 h-4" /> إضافة صيانة
                </button>
                <button onClick={() => { onViewDocs && onViewDocs(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-300 hover:bg-slate-700 transition-colors border-t border-slate-700">
                  <FileText className="w-4 h-4" /> مستنداتها
                  {docsCount > 0 && (
                    <span className="mr-auto bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {docsCount}
                    </span>
                  )}
                </button>
                <button onClick={() => { onViewMaintenance && onViewMaintenance(item); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-300 hover:bg-slate-700 transition-colors">
                  <ClipboardList className="w-4 h-4" /> سجل الصيانة
                  {maintenanceCount > 0 && (
                    <span className="mr-auto bg-emerald-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {maintenanceCount}
                    </span>
                  )}
                </button>
                {canEdit && (
                  <button onClick={() => { onEdit(item); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-400 hover:bg-slate-700 transition-colors border-t border-slate-700">
                    <Edit2 className="w-4 h-4" /> تعديل
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => { onDelete(item); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                    <Trash2 className="w-4 h-4" /> حذف
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Driver */}
      {item.driver && (
        <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.driver}</span>
        </div>
      )}

      {/* Meter Reading */}
      <div className="flex items-center justify-between mb-3 p-2.5 bg-slate-900/60 rounded-lg">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400">قراءة العداد</span>
        </div>
        <span className="font-bold text-white text-sm">
          {(item.currentReading || 0).toLocaleString()} {unit}
        </span>
      </div>

      {/* Oil Status */}
      {item.oilChangeInterval > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">حالة الزيت</span>
            </div>
            <OilStatusBadge item={item} />
          </div>
          <ProgressBar percentage={oilStatus.percentage} status={oilStatus.status} />
          <div className="flex justify-between text-xs text-slate-500">
            <span>المتبقي: {oilStatus.remaining?.toLocaleString() || '—'} {unit}</span>
            <span>كل: {item.oilChangeInterval?.toLocaleString()} {unit}</span>
          </div>
        </div>
      )}

      {/* Last Maintenance */}
      {item.lastMaintenanceDate && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-1.5 text-xs text-slate-500">
          <Wrench className="w-3 h-3" />
          <span>آخر صيانة: {formatDate(item.lastMaintenanceDate)}</span>
        </div>
      )}

      {/* Docs + Maintenance badges */}
      {(docsCount > 0 || maintenanceCount > 0) && (
        <div className="mt-2 pt-2 border-t border-slate-700 flex gap-3">
          {docsCount > 0 && (
            <button onClick={() => onViewDocs && onViewDocs(item)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <FileText className="w-3 h-3" />
              <span>{docsCount} مستند</span>
            </button>
          )}
          {maintenanceCount > 0 && (
            <button onClick={() => onViewMaintenance && onViewMaintenance(item)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              <ClipboardList className="w-3 h-3" />
              <span>{maintenanceCount} صيانة</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
