// src/pages/Documents.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection, deleteItem, updateItem } from '../firebase/firestore'
import DocumentForm from '../components/Documents/DocumentForm'
import { DocStatusBadge, SearchInput, EmptyState, ConfirmDialog, LoadingSpinner, Pagination, Modal } from '../components/Common'
import { FileText, Plus, Trash2, Eye, Edit2, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { calculateDocumentStatus } from '../utils/calculations'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 15
const CATEGORY_LABELS = { equipment: 'معدة/سيارة', employee: 'موظف' }
const EQUIPMENT_DOC_TYPES = ['رخصة سير', 'تأمين', 'فحص دوري', 'استمارة', 'عقد', 'أخرى']
const EMPLOYEE_DOC_TYPES  = ['إقامة', 'تأمين طبي', 'رخصة قيادة', 'شهادة', 'فحص طبي', 'أخرى']

// ─── Edit Modal ───────────────────────────────────────────────
function EditDocModal({ isOpen, onClose, doc, allEquipment, allVehicles }) {
  const [form, setForm]       = useState({})
  const [loading, setLoading] = useState(false)
  const [newFile, setNewFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  useEffect(() => {
    if (doc) { setForm({ ...doc }); setNewFile(null) }
  }, [doc])

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'fleet_documents')
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      { method: 'POST', body: formData }
    )
    if (!res.ok) throw new Error('فشل رفع الملف')
    const data = await res.json()
    return { fileUrl: data.secure_url, fileName: file.name }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleLinkedChange = (e) => {
    const val = e.target.value
    if (!val) return setForm(prev => ({ ...prev, linkedId: '', linkedName: '', linkedType: '' }))
    const [type, id] = val.split('::')
    const allItems = [
      ...allEquipment.map(i => ({ ...i, _type: 'equipment' })),
      ...allVehicles.map(i => ({ ...i, _type: 'vehicle' })),
    ]
    const found = allItems.find(i => i.id === id)
    if (found) setForm(prev => ({ ...prev, linkedId: id, linkedName: found.name, linkedType: type }))
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('اسم المستند مطلوب')
    setLoading(true)
    try {
      let updatedForm = { ...form }
      if (newFile) {
        setUploading(true)
        const result = await uploadToCloudinary(newFile)
        updatedForm.fileUrl  = result.fileUrl
        updatedForm.fileName = result.fileName
        setUploading(false)
      }
      await updateItem('documents', doc.id, updatedForm)
      toast.success('تم التحديث بنجاح')
      setNewFile(null)
      onClose()
    } catch (err) {
      toast.error('فشل التحديث: ' + err.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const docTypes = form.category === 'equipment' ? EQUIPMENT_DOC_TYPES : EMPLOYEE_DOC_TYPES

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تعديل المستند" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">اسم المستند *</label>
            <input name="name" value={form.name || ''} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">تصنيف المستند</label>
            <select name="category" value={form.category || 'equipment'} onChange={handleChange} className="input-field">
              <option value="equipment">معدة / سيارة</option>
              <option value="employee">موظف</option>
            </select>
          </div>
          <div>
            <label className="label">نوع المستند</label>
            <select name="docType" value={form.docType || ''} onChange={handleChange} className="input-field">
              <option value="">اختر النوع</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.category === 'equipment' && (
            <div className="col-span-2">
              <label className="label">مرتبط بـ</label>
              <select
                onChange={handleLinkedChange}
                className="input-field"
                value={form.linkedId ? `${form.linkedType}::${form.linkedId}` : ''}
              >
                <option value="">اختر المعدة أو السيارة...</option>
                <optgroup label="المعدات">
                  {allEquipment.map(e => <option key={e.id} value={`equipment::${e.id}`}>{e.name}</option>)}
                </optgroup>
                <optgroup label="السيارات">
                  {allVehicles.map(v => <option key={v.id} value={`vehicle::${v.id}`}>{v.name}</option>)}
                </optgroup>
              </select>
            </div>
          )}
          <div>
            <label className="label">تاريخ الإصدار</label>
            <input type="date" name="issueDate" value={form.issueDate || ''} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">تاريخ الانتهاء</label>
            <input type="date" name="expiryDate" value={form.expiryDate || ''} onChange={handleChange} className="input-field" />
          </div>
          <div className="col-span-2">
            <label className="label">ملاحظات</label>
            <textarea name="notes" value={form.notes || ''} onChange={handleChange}
              className="input-field h-16 resize-none" placeholder="ملاحظات..." />
          </div>

          {/* تغيير الملف */}
          <div className="col-span-2">
            <label className="label">تغيير الملف المرفق (اختياري)</label>
            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">
                {newFile ? newFile.name : form.fileName ? `الملف الحالي: ${form.fileName}` : 'اضغط لتغيير الملف'}
              </span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setNewFile(e.target.files[0])} />
            </label>
            {form.fileUrl && !newFile && (
              <a href={form.fileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-400 hover:underline mt-1 block">
                👁️ عرض الملف الحالي
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button onClick={handleSave} disabled={loading || uploading} className="btn-primary flex-1 justify-center">
            {uploading ? 'جاري رفع الملف...' : loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function Documents() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const { hasPermission } = useAuth()
  const [docs, setDocs]                   = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editDoc, setEditDoc]             = useState(null)
  const [search, setSearch]               = useState('')
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [currentPage, setCurrentPage]     = useState(1)

  useEffect(() => {
    const unsub = subscribeToCollection('documents', data => {
      setDocs(data.sort((a, b) => {
        const order = { expired: 0, critical: 1, warning: 2, ok: 3, unknown: 4 }
        const sa = calculateDocumentStatus(a.expiryDate).status
        const sb = calculateDocumentStatus(b.expiryDate).status
        return (order[sa] || 4) - (order[sb] || 4)
      }))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      d.name?.toLowerCase().includes(q) ||
      d.docType?.toLowerCase().includes(q) ||
      d.linkedName?.toLowerCase().includes(q)
    const status = calculateDocumentStatus(d.expiryDate).status
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'expired' && status === 'expired') ||
      (filterStatus === 'warning' && ['warning', 'critical'].includes(status)) ||
      (filterStatus === 'ok' && status === 'ok')
    const matchCat = filterCategory === 'all' || d.category === filterCategory
    return matchSearch && matchStatus && matchCat
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDelete = async () => {
    try {
      await deleteItem('documents', deleteTarget.id)
      toast.success('تم الحذف')
      setDeleteTarget(null)
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const expiredCount = docs.filter(d => calculateDocumentStatus(d.expiryDate).status === 'expired').length
  const warningCount = docs.filter(d => ['warning', 'critical'].includes(calculateDocumentStatus(d.expiryDate).status)).length

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
            <Plus className="w-4 h-4" /> إضافة مستند
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث في المستندات..." />
        </div>
        <select value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }}
          className="input-field w-auto">
          <option value="all">جميع الحالات</option>
          <option value="expired">منتهية</option>
          <option value="warning">تنتهي قريباً</option>
          <option value="ok">سارية</option>
        </select>
        <select value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1) }}
          className="input-field w-auto">
          <option value="all">جميع الأنواع</option>
          <option value="equipment">معدات/سيارات</option>
          <option value="employee">موظفين</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد مستندات" message="أضف أول مستند للبدء"
          action={hasPermission('addDocuments') && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> إضافة مستند
            </button>
          )} />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">المستند</th>
                    <th className="px-4 py-3 text-right">النوع</th>
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
                        {doc.notes && (
                          <div className="text-xs text-slate-500 truncate max-w-[150px]">{doc.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{doc.docType || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{doc.linkedName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{doc.issueDate || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{doc.expiryDate || '—'}</td>
                      <td className="px-4 py-3"><DocStatusBadge expiryDate={doc.expiryDate} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 p-1">
                              <Eye className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => setEditDoc(doc)}
                            className="text-blue-400 hover:text-blue-300 p-1">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {hasPermission('manageDocuments') && (
                            <button onClick={() => setDeleteTarget(doc)}
                              className="text-red-400 hover:text-red-300 p-1">
                              <Trash2 className="w-4 h-4" />
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

      <DocumentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        allEquipment={equipment}
        allVehicles={vehicles}
      />
      <EditDocModal
        isOpen={!!editDoc}
        onClose={() => setEditDoc(null)}
        doc={editDoc}
        allEquipment={equipment}
        allVehicles={vehicles}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="حذف المستند"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
      />
    </div>
  )
}
