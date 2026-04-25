// src/pages/Documents.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection, deleteItem } from '../firebase/firestore'
import DocumentForm from '../components/Documents/DocumentForm'
import { DocStatusBadge, SearchInput, EmptyState, ConfirmDialog, LoadingSpinner, Pagination } from '../components/Common'
import { FileText, Plus, Trash2, Download, Eye, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { calculateDocumentStatus } from '../utils/calculations'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 15

const CATEGORY_LABELS = { equipment: 'معدة/سيارة', employee: 'موظف' }

export default function Documents() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const { hasPermission } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const unsub = subscribeToCollection('documents', data => {
      setDocs(data.sort((a,b) => {
        const sa = calculateDocumentStatus(a.expiryDate)
        const sb = calculateDocumentStatus(b.expiryDate)
        const order = {expired:0,critical:1,warning:2,ok:3,unknown:4}
        return (order[sa.status]||4)-(order[sb.status]||4)
      }))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !search || d.name?.toLowerCase().includes(q) || d.docType?.toLowerCase().includes(q) || d.linkedName?.toLowerCase().includes(q)
    const status = calculateDocumentStatus(d.expiryDate).status
    const matchStatus = filterStatus === 'all' || (filterStatus === 'expired' && status === 'expired') || (filterStatus === 'warning' && ['warning','critical'].includes(status)) || (filterStatus === 'ok' && status === 'ok')
    const matchCat = filterCategory === 'all' || d.category === filterCategory
    return matchSearch && matchStatus && matchCat
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)

  const handleDelete = async () => {
    try { await deleteItem('documents', deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null) }
    catch { toast.error('فشل الحذف') }
  }

  const expiredCount = docs.filter(d=>calculateDocumentStatus(d.expiryDate).status==='expired').length
  const warningCount = docs.filter(d=>['warning','critical'].includes(calculateDocumentStatus(d.expiryDate).status)).length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white">📄 المستندات والوثائق</h1>
          <p className="text-slate-400 text-sm">
            {docs.length} مستند •
            <span className="text-red-400 mr-2">{expiredCount} منتهية</span> •
            <span className="text-amber-400 mr-2">{warningCount} تنتهي قريباً</span>
          </p>
        </div>
        {hasPermission('addDocuments') && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4"/> إضافة مستند
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث في المستندات..." />
        </div>
        <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setCurrentPage(1)}} className="input-field w-auto">
          <option value="all">جميع الحالات</option>
          <option value="expired">منتهية</option>
          <option value="warning">تنتهي قريباً</option>
          <option value="ok">سارية</option>
        </select>
        <select value={filterCategory} onChange={e=>{setFilterCategory(e.target.value);setCurrentPage(1)}} className="input-field w-auto">
          <option value="all">جميع الأنواع</option>
          <option value="equipment">معدات/سيارات</option>
          <option value="employee">موظفين</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد مستندات" message="أضف أول مستند للبدء"
          action={hasPermission('addDocuments') && <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/> إضافة مستند</button>} />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">المستند</th>
                    <th className="px-4 py-3 text-right">النوع</th>
                    <th className="px-4 py-3 text-right">التصنيف</th>
                    <th className="px-4 py-3 text-right">مرتبط بـ</th>
                    <th className="px-4 py-3 text-right">الإصدار</th>
                    <th className="px-4 py-3 text-right">الانتهاء</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(doc => (
                    <tr key={doc.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-sm">{doc.name}</div>
                        {doc.notes && <div className="text-xs text-slate-500 truncate max-w-[150px]">{doc.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{doc.docType || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{CATEGORY_LABELS[doc.category] || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{doc.linkedName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{doc.issueDate || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{doc.expiryDate || '—'}</td>
                      <td className="px-4 py-3"><DocStatusBadge expiryDate={doc.expiryDate} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 p-1">
                              <Eye className="w-4 h-4"/>
                            </a>
                          )}
                          {hasPermission('manageDocuments') && (
                            <button onClick={()=>setDeleteTarget(doc)} className="text-red-400 hover:text-red-300 p-1">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      <DocumentForm isOpen={showForm} onClose={()=>setShowForm(false)} allEquipment={equipment} allVehicles={vehicles} />
      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}
        title="حذف المستند" message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`} />
    </div>
  )
}
