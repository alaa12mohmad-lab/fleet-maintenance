// src/components/Documents/DocumentForm.jsx
import { useState } from 'react'
import { Modal } from '../Common'
import { addDocument } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Upload, FileText } from 'lucide-react'

const EQUIPMENT_DOC_TYPES = ['رخصة سير', 'تأمين', 'فحص دوري', 'استمارة', 'عقد', 'أخرى']
const EMPLOYEE_DOC_TYPES  = ['إقامة', 'تأمين طبي', 'رخصة قيادة', 'شهادة', 'فحص طبي', 'أخرى']

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

async function uploadToCloudinary(file) {
  const isPDF = file.type === 'application/pdf'
  const resourceType = isPDF ? 'raw' : 'image'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'fleet_documents')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('فشل رفع الملف')
  const data = await res.json()

  const fileUrl = isPDF
    ? data.secure_url
    : data.secure_url

  return { fileUrl, fileName: file.name, fileType: file.type }
}

export default function DocumentForm({ isOpen, onClose, allEquipment = [], allVehicles = [] }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [file, setFile]       = useState(null)
  const [form, setForm]       = useState({
    name: '', docType: '', category: 'equipment',
    linkedId: '', linkedName: '', linkedType: '',
    issueDate: '', expiryDate: '', notes: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'category') {
      setForm(prev => ({ ...prev, [name]: value, linkedId: '', linkedName: '', linkedType: '', docType: '' }))
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('اسم المستند مطلوب')
    setLoading(true)
    try {
      let fileUrl = '', fileName = ''
      if (file) {
        const result = await uploadToCloudinary(file)
        fileUrl  = result.fileUrl
        fileName = result.fileName
      }
      await addDocument({ ...form, fileUrl, fileName }, currentUser.uid)
      toast.success('تم إضافة المستند بنجاح')
      setForm({ name: '', docType: '', category: 'equipment', linkedId: '', linkedName: '', linkedType: '', issueDate: '', expiryDate: '', notes: '' })
      setFile(null)
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const docTypes = form.category === 'equipment' ? EQUIPMENT_DOC_TYPES : EMPLOYEE_DOC_TYPES

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة مستند" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">اسم المستند *</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="اسم المستند" required />
          </div>
          <div>
            <label className="label">تصنيف المستند</label>
            <select name="category" value={form.category} onChange={handleChange} className="input-field">
              <option value="equipment">معدة / سيارة</option>
              <option value="employee">موظف</option>
            </select>
          </div>
          <div>
            <label className="label">نوع المستند</label>
            <select name="docType" value={form.docType} onChange={handleChange} className="input-field">
              <option value="">اختر النوع</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.category === 'equipment' && (
            <div className="col-span-2">
              <label className="label">مرتبط بـ (معدة / سيارة)</label>
              <select onChange={handleLinkedChange} className="input-field" defaultValue="">
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
            <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">تاريخ الانتهاء</label>
            <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">الملف المرفق (PDF أو صورة)</label>
          <label className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
            <Upload className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400">
              {file ? file.name : 'اضغط لرفع ملف'}
            </span>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files[0])} />
          </label>
        </div>

        <div>
          <label className="label">ملاحظات</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            className="input-field h-16 resize-none" placeholder="ملاحظات..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <FileText className="w-4 h-4" />
            {loading ? 'جاري الرفع...' : 'حفظ المستند'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
