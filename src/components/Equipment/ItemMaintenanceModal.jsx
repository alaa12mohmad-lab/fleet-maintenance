// src/components/Equipment/ItemMaintenanceModal.jsx
import { Modal } from '../Common'
import { Wrench, CalendarDays, ExternalLink, Download, FileText, Gauge } from 'lucide-react'

function getFileIcon(fileName) {
  if (!fileName) return '📎'
  if (fileName?.toLowerCase().endsWith('.pdf')) return '📄'
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) return '🖼️'
  return '📎'
}

function exportMaintenancePDF(item, logs) {
  const now = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  const totalCost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0)

  const rows = logs.map(log => {
    const attachments = log.attachments?.length ? log.attachments : []
    const links = attachments.map(f =>
      `<a href="${f.fileUrl}" target="_blank" style="color:#3b82f6;font-size:11px;display:block">${getFileIcon(f.fileName)} ${f.fileName || 'ملف'}</a>`
    ).join('')
    return `
      <tr>
        <td>${log.date || '—'}</td>
        <td><span style="background:#1e3a5f;color:#60a5fa;padding:2px 8px;border-radius:4px;font-size:11px">${log.maintenanceType}</span></td>
        <td>${log.meterReading ? Number(log.meterReading).toLocaleString('ar-SA') : '—'}</td>
        <td style="color:#34d399;font-weight:600">${log.cost > 0 ? Number(log.cost).toLocaleString('ar-SA') + ' ر.س' : '—'}</td>
        <td>${log.workshop || '—'}</td>
        <td style="font-size:11px;color:#94a3b8">${log.description || '—'}</td>
        <td>${links || '—'}</td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/><title>سجل صيانة ${item.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; color:#1e293b; font-size:12px; }
  .cover { background:linear-gradient(135deg,#0f172a,#1e293b,#14532d); color:#fff; padding:32px 40px 24px; margin-bottom:24px; }
  .cover-title { font-size:24px; font-weight:800; color:#34d399; margin-bottom:4px; }
  .cover-sub { color:#94a3b8; margin-bottom:20px; }
  .stats { display:flex; gap:16px; flex-wrap:wrap; }
  .stat { background:rgba(255,255,255,0.08); border-radius:10px; padding:12px 18px; text-align:center; border:1px solid rgba(255,255,255,0.1); }
  .stat-num { font-size:24px; font-weight:800; color:#34d399; }
  .stat-label { font-size:10px; color:#94a3b8; margin-top:2px; }
  .section { padding:0 40px 24px; }
  .section-title { font-size:15px; font-weight:700; color:#0f172a; margin-bottom:12px; padding-bottom:6px; border-bottom:3px solid #22c55e; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  thead tr { background:#1e293b; color:#fff; }
  thead th { padding:9px 10px; text-align:right; font-weight:600; }
  tbody tr { border-bottom:1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  td { padding:8px 10px; vertical-align:middle; }
  .footer { text-align:center; font-size:10px; color:#94a3b8; padding:16px 40px; border-top:1px solid #e2e8f0; margin-top:16px; }
  @media print { body { font-size:10px; } .cover { margin-bottom:16px; } }
</style></head>
<body>
  <div class="cover">
    <div class="cover-title">🔧 سجل صيانة ${item.name}</div>
    <div class="cover-sub">${item.code || item.plateNumber || ''} &nbsp;·&nbsp; ${now}</div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${logs.length}</div><div class="stat-label">إجمالي السجلات</div></div>
      <div class="stat"><div class="stat-num" style="color:#fbbf24">${totalCost.toLocaleString('ar-SA')}</div><div class="stat-label">إجمالي التكاليف (ر.س)</div></div>
      <div class="stat"><div class="stat-num" style="color:#60a5fa">${logs.filter(l=>l.attachments?.length>0).length}</div><div class="stat-label">سجلات بمرفقات</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">📋 تفاصيل سجلات الصيانة</div>
    <table>
      <thead><tr><th>التاريخ</th><th>نوع الصيانة</th><th>قراءة العداد</th><th>التكلفة</th><th>الورشة</th><th>الوصف</th><th>المرفقات</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px">لا توجد سجلات</td></tr>'}</tbody>
    </table>
  </div>
  <div class="footer">نظام إدارة الأسطول والمعدات &nbsp;·&nbsp; ${now}</div>
  <script>window.onload=()=>window.print()</script>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

export default function ItemMaintenanceModal({ isOpen, onClose, item, logs = [], onEdit }) {
  if (!item) return null

  const totalCost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0)
  const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`سجل صيانة — ${item.name}`} size="lg">
      <div className="space-y-4">

        {/* رأس */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-slate-400">
            {logs.length} سجل &nbsp;·&nbsp;
            <span className="text-emerald-400 font-semibold">إجمالي: {totalCost.toLocaleString()} ر.س</span>
          </div>
          {logs.length > 0 && (
            <button onClick={() => exportMaintenancePDF(item, logs)}
              className="flex items-center gap-1 text-xs bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors">
              <FileText className="w-3.5 h-3.5" /> طباعة / PDF
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد سجلات صيانة لهذه المعدة</p>
            <p className="text-xs mt-1">أضف سجلاً من صفحة سجل الصيانة</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pl-1">
            {logs.map(log => {
              const attachments = log.attachments?.length ? log.attachments : []
              return (
                <div key={log.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="bg-primary-900/40 text-primary-400 px-2 py-0.5 rounded text-xs font-semibold">
                        {log.maintenanceType}
                      </span>
                      {log.workshop && <span className="text-xs text-slate-500 mr-2">— {log.workshop}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <CalendarDays className="w-3 h-3" /> {log.date || '—'}
                      </span>
                      {onEdit && (
                        <button onClick={() => onEdit(log)}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-0.5 bg-blue-900/30 rounded transition-colors">
                          تعديل
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {log.meterReading > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Gauge className="w-3 h-3" />
                        {Number(log.meterReading).toLocaleString()} {unit}
                      </div>
                    )}
                    {log.cost > 0 && (
                      <div className="text-emerald-400 font-semibold">
                        {Number(log.cost).toLocaleString()} ر.س
                      </div>
                    )}
                  </div>

                  {log.description && (
                    <div className="text-xs text-slate-400 bg-slate-900/50 rounded px-2 py-1">
                      {log.description}
                    </div>
                  )}

                  {log.notes && (
                    <div className="text-xs text-slate-500">📝 {log.notes}</div>
                  )}

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-700">
                      {attachments.map((f, i) => (
                        <a key={i} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          {getFileIcon(f.fileName)} {f.fileName || `ملف ${i+1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
