// src/components/Maintenance/MaintenanceForm.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../Common'
import { addMaintenanceLog } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Wrench } from 'lucide-react'

const MAINTENANCE_TYPES = [
  'صيانة دورية', 'تغيير فلتر', 'إصلاح فرامل', 'إصلاح محرك',
  'تغيير إطارات', 'صيانة كهربائية', 'إصلاح تعليق', 'غسيل وتشحيم',
  'فحص شامل', 'إصلاح مبرد', 'أخرى'
]

export default function MaintenanceForm({ isOpen, onClose, item = null, allEquipment = [], allVehicles = [] }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    equipmentId: '', equipmentName: '', equipmentType: '',
    maintenanceType: '', description: '', date: new Date().toISOString().split('T')[0],
    meterReading: '', cost: '', workshop: '', notes: '',
  })

  const allItems = [
    ...allEquipment.map(e => ({ ...e, _type: 'equipment', _label: `⚙️ ${e.name}` })),
    ...allVehicles.map(v => ({ ...v, _type: 'vehicle', _label: `🚗 ${v.name}` })),
  ]

  useEffect(() => {
    if (item) {
      setForm(prev => ({
        ...prev,
        equipmentId: item.id,
        equipmentName: item.name,
        equipmentType: item.type || 'equipment',
        meterReading: item.currentReading || '',
      }))
    }
  }, [item, isOpen])

  const handleEquipmentChange = (e) => {
    const selected = allItems.find(i => i.id === e.target.value)
    if (selected) {
      setForm(prev => ({
        ...prev,
        equipmentId: selected.id,
        equipmentName: selected.name,
        equipmentType: selected._type,
        meterReading: selected.currentReading || '',
      }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.equipmentId) return toast.error('اختر المعدة أو السيارة')
    if (!form.maintenanceType) return toast.error('اختر نوع الصيانة')
    setLoading(true)
    try {
      await addMaintenanceLog(form, currentUser.uid)
      toast.success('تم تسجيل الصيانة بنجاح')
      setForm({
        equipmentId: '', equipmentName: '', equipmentType: '',
        maintenanceType: '', description: '', date: new Date().toISOString().split('T')[0],
        meterReading: '', cost: '', workshop: '', notes: '',
      })
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة سجل صيانة" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Equipment Selection */}
        <div>
          <label className="label">المعدة / السيارة *</label>
          {item ? (
            <div className="input-field bg-slate-800 text-slate-300">{item.name}</div>
          ) : (
            <select
              value={form.equipmentId}
              onChange={handleEquipmentChange}
              className="input-field"
              required
            >
              <option value="">اختر المعدة أو السيارة...</option>
              <optgroup label="المعدات">
                {allEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </optgroup>
              <optgroup label="السيارات">
                {allVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
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

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <Wrench className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'تسجيل الصيانة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
