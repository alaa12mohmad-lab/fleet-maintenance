// src/components/Maintenance/MaintenanceForm.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../Common'
import { addMaintenanceLog, updateItem } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { Wrench, Upload, X } from 'lucide-react'

const MAINTENANCE_TYPES = [
  'صيانة دورية', 'تغيير فلتر', 'إصلاح فرامل', 'إصلاح محرك',
  'تغيير إطارات', 'صيانة كهربائية', 'إصلاح تعليق', 'غسيل وتشحيم',
  'فحص شامل', 'إصلاح مبرد', 'أخرى'
]

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

async function uploadFile(file) {
  const fileName = `maintenance/${Date.now()}_${file.name.replace(/\s/g, '_').replace(/[^\w._-]/g, '').toLowerCase()}`
  const { error } = await supabase.storage
    .from('fleet-documents')
    .upload(fileName, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('فشل رفع الملف: ' + error.message)
  const { data: urlData } = supabase.storage.from('fleet-documents').getPublicUrl(fileName)
  return { fileUrl: urlData.publicUrl, fileName: file.name, fileType: file.type }
}

function getFileIcon(fileName) {
  if (!fileName) return '📎'
  if (fileName.toLowerCase().endsWith('.pdf')) return '📄'
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) return '🖼️'
  return '📎'
}

const EMPTY_FORM = {
  equipmentId: '', equipmentName: '', equipmentCode: '', equipmentType: '',
  maintenanceType: '', description: '', date: new Date().toISOString().split('T')[0],
  meterReading: '', cost: '', workshop: '', notes: '', attachments: [],
}

export default function MaintenanceForm({ isOpen, onClose, item = null, allEquipment = [], allVehicles = [], editLog = null }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const isEdit = !!editLog

  const allItems = [
    ...allEquipment.map(e => ({ ...e, _type: 'equipment' })),
    ...allVehicles.map(v => ({ ...v, _type: 'vehicle' })),
  ]

  useEffect(() => {
    if (!isOpen) return
    if (isEdit) {
      setForm({ ...EMPTY_FORM, ...editLog })
      setFiles([])
    } else if (item) {
      setForm({ ...EMPTY_FORM,
        equipmentId: item.id,
        equipmentName: item.name,
        equipmentCode: item.code || item.plateNumber || '',
        equipmentType: item._type || item.type || 'equipment',
        meterReading: item.currentReading || '',
      })
      setFiles([])
    } else {
      setForm(EMPTY_FORM)
      setFiles([])
    }
  }, [item, isOpen, editLog])

  const handleEquipmentChange = (e) => {
    const selected = allItems.find(i => i.id === e.target.value)
    if (selected) {
      setForm(prev => ({
        ...prev,
        equipmentId: selected.id,
        equipmentName: selected.name,
        equipmentCode: selected.code || selected.plateNumber || '',
        equipmentType: selected._type,
        meterReading: selected.currentReading || '',
      }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(prev => {
      const existing = prev.map(f => f.name)
      return [...prev, ...selected.filter(f => !existing.includes(f.name))]
    })
    e.target.value = ''
  }

  const removeNewFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const removeExistingFile = (i) => {
    setForm(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, idx) => idx !== i)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.equipmentId) return toast.error('اختر المعدة أو السيارة')
    if (!form.maintenanceType) return toast.error('اختر نوع الصيانة')
    setLoading(true)
    try {
      const uploaded = []
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`جاري رفع الملف ${i + 1} من ${files.length}...`)
        const result = await uploadFile(files[i])
        uploaded.push(result)
      }
      setUploadProgress('')

      const existingAttachments = form.attachments || []
      const allAttachments = [...existingAttachments, ...uploaded]

      const data = { ...form, attachments: allAttachments }

      if (isEdit) {
        await updateItem('maintenance_logs', editLog.id, data)
        toast.success('تم تحديث السجل')
      } else {
        await addMaintenanceLog(data, currentUser.uid)
        toast.success('تم تسجيل الصيانة بنجاح')
      }

      setForm(EMPTY_FORM)
      setFiles([])
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  const existingAttachments = form.attachments || []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل سجل الصيانة' : 'إضافة سجل صيانة'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* اختيار المعدة */}
        <div>
          <label className="label">المعدة / السيارة *</label>
          {item || isEdit ? (
            <div className="input-field bg-slate-800 text-slate-300 flex items-center gap-2">
              <span>{form.equipmentName}</span>
              {form.equipmentCode && <span className="text-xs text-slate-500 font-mono">({form.equipmentCode})</span>}
            </div>
          ) : (
            <select value={form.equipmentId} onChange={handleEquipmentChange} className="input-field" required>
              <option value="">اختر المعدة أو السيارة...</option>
              <optgroup label="المعدات">
                {allEquipment.map(e => <option key={e.id} value={e.id}>{e.name} {e.code ? `- ${e.code}` : ''}</option>)}
              </optgroup>
              <optgroup label="السيارات">
                {allVehicles.map(v => <option key={v.id} value={v.id}>{v.name} {v.plateNumber ? `- ${v.plateNumber}` : ''}</option>)}
              </optgroup>
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">نوع الصيانة *</label>
            <select name="maintenanceType" value={form.maintenanceType} onChange={handleChange} className="input-field" required>
              <option value="">اختر نوع الصيانة</option>
              {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">تاريخ الصيانة</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">قراءة العداد وقت الصيانة</label>
            <input type="number" name="meterReading" value={form.meterReading} onChange={handleChange} className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="label">التكلفة (ريال)</label>
            <input type="number" name="cost" value={form.cost} onChange={handleChange} className="input-field" placeholder="0.00" step="0.01" />
          </div>
          <div className="col-span-2">
            <label className="label">ورشة / مزود الخدمة</label>
            <input name="workshop" value={form.workshop} onChange={handleChange} className="input-field" placeholder="اسم الورشة" />
          </div>
        </div>

        <div>
          <label className="label">وصف الصيانة</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            className="input-field h-20 resize-none" placeholder="وصف تفصيلي للصيانة..." />
        </div>

        <div>
          <label className="label">ملاحظات إضافية</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            className="input-field h-16 resize-none" placeholder="ملاحظات..." />
        </div>

        {/* الملفات الحالية عند التعديل */}
        {existingAttachments.length > 0 && (
          <div>
            <label className="label">الملفات الحالية ({existingAttachments.length})</label>
            <div className="space-y-2">
              {existingAttachments.map((att, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg">
                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 min-w-0 flex-1">
                    <span className="text-base flex-shrink-0">{getFileIcon(att.fileName)}</span>
                    <span className="truncate">{att.fileName || `ملف ${i + 1}`}</span>
                  </a>
                  <button type="button" onClick={() => removeExistingFile(i)}
                    className="text-red-400 hover:text-red-300 p-1 flex-shrink-0 mr-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* رفع ملفات جديدة */}
        <div>
          <label className="label">{isEdit ? 'إضافة ملفات جديدة' : 'صور / ملفات الصيانة'}</label>
          <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
            <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-400">اضغط لإضافة صور أو PDF للصيانة</span>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple onChange={handleFilesChange} />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{getFileIcon(file.name)}</span>
                    <span className="text-sm text-slate-300 truncate">{file.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">({(file.size/1024).toFixed(0)} KB)</span>
                  </div>
                  <button type="button" onClick={() => removeNewFile(i)}
                    className="text-red-400 hover:text-red-300 p-1 flex-shrink-0 mr-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploadProgress && (
          <div className="p-3 bg-primary-900/30 border border-primary-700/40 rounded-lg text-sm text-primary-300 text-center">
            ⏳ {uploadProgress}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <Wrench className="w-4 h-4" />
            {loading ? (uploadProgress || 'جاري الحفظ...') : isEdit ? 'حفظ التعديلات' : 'تسجيل الصيانة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
