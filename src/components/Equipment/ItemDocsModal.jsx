// src/components/Equipment/ItemDocsModal.jsx
import { Modal } from '../Common'
import { FileText, Download, ExternalLink, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { calculateDocumentStatus } from '../../utils/calculations'

function getStatusInfo(doc) {
  const s = calculateDocumentStatus(doc.expiryDate)
  if (s.status === 'expired')  return { label: 'منتهي', color: 'text-red-400',    icon: '⛔' }
  if (s.status === 'critical') return { label: `${s.daysLeft} يوم`, color: 'text-red-400',    icon: '⚠️' }
  if (s.status === 'warning')  return { label: `${s.daysLeft} يوم`, color: 'text-amber-400',  icon: '⚠️' }
  if (s.status === 'ok')       return { label: `${s.daysLeft} يوم`, color: 'text-emerald-400', icon: '✅' }
  return { label: 'غير محدد', color: 'text-slate-400', icon: '—' }
}

function getViewUrl(url, fileName) {
  if (!url) return null
  const isPDF = fileName?.toLowerCase().endsWith('.pdf') || url.toLowerCase().endsWith('.pdf')
  if (url.includes('cloudinary.com') && isPDF) {
    return url.replace('/image/upload/', '/raw/upload/')
  }
  return url
}

function getFileIcon(fileName) {
  if (!fileName) return '📎'
  if (fileName.toLowerCase().endsWith('.pdf')) return '📄'
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) return '🖼️'
  return '📎'
}

export default function ItemDocsModal({ isOpen, onClose, item, docs = [] }) {
  if (!item) return null

  const activeDocs  = docs.filter(d => calculateDocumentStatus(d.expiryDate).status !== 'expired')
  const expiredDocs = docs.filter(d => calculateDocumentStatus(d.expiryDate).status === 'expired')

  const downloadDoc = (doc) => {
    const allFiles = doc.attachments?.length ? doc.attachments : doc.fileUrl ? [{ fileUrl: doc.fileUrl, fileName: doc.fileName }] : []
    allFiles.forEach(f => {
      if (!f.fileUrl) return
      const a = document.createElement('a')
      a.href = f.fileUrl
      a.download = f.fileName || doc.name
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    })
  }

  const printAllDocs = () => {
    const now = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    const rows = docs.map(doc => {
      const s = getStatusInfo(doc)
      const allFiles = doc.attachments?.length ? doc.attachments : doc.fileUrl ? [{ fileUrl: doc.fileUrl, fileName: doc.fileName }] : []
      const links = allFiles.map(f =>
        f.fileUrl ? `<a href="${f.fileUrl}" target="_blank" style="color:#3b82f6;font-size:11px">${f.fileName || 'فتح'}</a>` : ''
      ).join('<br/>')
      return `
        <tr>
          <td>${doc.name}</td>
          <td>${doc.docType || '—'}</td>
          <td>${doc.issueDate || '—'}</td>
          <td>${doc.expiryDate || '—'}</td>
          <td style="font-weight:600">${s.icon} ${s.label}</td>
          <td>${links || '—'}</td>
          <td>${doc.notes || '—'}</td>
        </tr>`
    }).join('')

    const html = `
<!DOCTYPE html><html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/><title>مستندات ${item.name}</title>
<style>
  body { font-family:'Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; color:#1e293b; font-size:12px; }
  .header { background:linear-gradient(135deg,#0f172a,#1e293b); color:#fff; padding:24px 32px; margin-bottom:24px; }
  .title { font-size:22px; font-weight:800; color:#fbbf24; }
  .sub { color:#94a3b8; margin-top:4px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#1e293b; color:#fff; padding:10px; text-align:right; font-size:11px; }
  td { padding:9px 10px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
  tr:nth-child(even) { background:#f8fafc; }
  .footer { text-align:center; color:#94a3b8; font-size:10px; margin-top:20px; }
</style></head>
<body>
<div class="header">
  <div class="title">📄 مستندات ${item.name}</div>
  <div class="sub">${item.code || item.plateNumber || ''} &nbsp;·&nbsp; ${now} &nbsp;·&nbsp; ${docs.length} مستند</div>
</div>
<table>
  <thead><tr><th>اسم المستند</th><th>النوع</th><th>تاريخ الإصدار</th><th>تاريخ الانتهاء</th><th>الحالة</th><th>الملفات</th><th>ملاحظات</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">نظام إدارة الأسطول والمعدات · ${now}</div>
<script>window.onload=()=>window.print()</script>
</body></html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
  }

  const DocRow = ({ doc }) => {
    const s = getStatusInfo(doc)
    const allFiles = doc.attachments?.length ? doc.attachments : doc.fileUrl ? [{ fileUrl: doc.fileUrl, fileName: doc.fileName }] : []
    return (
      <div className="card space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-white text-sm">{doc.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{doc.docType || '—'}</div>
          </div>
          <span className={`text-xs font-bold shrink-0 ${s.color}`}>{s.icon} {s.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          {doc.issueDate  && <span>📅 إصدار: {doc.issueDate}</span>}
          {doc.expiryDate && <span>⏳ انتهاء: {doc.expiryDate}</span>}
        </div>
        {doc.notes && <div className="text-xs text-slate-500 bg-slate-900/50 rounded px-2 py-1">📝 {doc.notes}</div>}
        {allFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {allFiles.map((f, i) => (
              <a key={i} href={getViewUrl(f.fileUrl, f.fileName)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded-lg transition-colors">
                <ExternalLink className="w-3 h-3" /> {f.fileName || 'فتح'}
              </a>
            ))}
            <button onClick={() => downloadDoc(doc)}
              className="flex items-center gap-1 text-xs bg-blue-700/40 hover:bg-blue-600/60 text-blue-300 px-2 py-1 rounded-lg transition-colors">
              <Download className="w-3 h-3" /> تحميل
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`مستندات — ${item.name}`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {docs.length} مستند &nbsp;·&nbsp;
            <span className="text-emerald-400">{activeDocs.length} ساري</span>
            {expiredDocs.length > 0 && <span className="text-red-400"> &nbsp;·&nbsp; {expiredDocs.length} منتهي</span>}
          </div>
          {docs.length > 0 && (
            <button onClick={printAllDocs}
              className="flex items-center gap-1 text-xs bg-amber-700/30 hover:bg-amber-600/40 text-amber-300 px-3 py-1.5 rounded-lg transition-colors">
              <FileText className="w-3.5 h-3.5" /> طباعة الكل PDF
            </button>
          )}
        </div>
        {docs.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد مستندات مرتبطة بهذه المعدة</p>
            <p className="text-xs mt-1">أضف مستنداً من صفحة المستندات واربطه بهذه المعدة</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pl-1">
            {activeDocs.length > 0 && (
              <div>
                <div className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> المستندات السارية ({activeDocs.length})
                </div>
                <div className="space-y-2">{activeDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}</div>
              </div>
            )}
            {expiredDocs.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> المستندات المنتهية ({expiredDocs.length})
                </div>
                <div className="space-y-2 opacity-70">{expiredDocs.map(doc => <DocRow key={doc.id} doc={doc} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
