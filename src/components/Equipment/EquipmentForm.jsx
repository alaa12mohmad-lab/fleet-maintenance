// src/components/Equipment/EquipmentForm.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../Common'
import { addItem, updateItem } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const INITIAL = {
  name: '', code: '', plateNumber: '', driver: '',
  meterType: 'km', currentReading: '', lastOilChangeReading: '',
  oilChangeInterval: '', lastMaintenanceDate: '', lastOilChangeDate: '',
  notes: '', type: 'equipment',
}

export default function EquipmentForm({ isOpen, onClose, item = null, itemType = 'equipment' }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const isEdit = !!item

  useEffect(() => {
    if (item) setForm({ ...INITIAL, ...item })
    else setForm({ ...INITIAL, type: itemType })
  }, [item, itemType, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('اسم المعدة مطلوب')
    setLoading(true)
    try {
      const coll = itemType === 'vehicle' ? 'vehicles' : 'equipments'
      const data = {
        ...form,
        type: itemType,
        currentReading: Number(form.currentReading) || 0,
        lastOilChangeReading: Number(form.lastOilChangeReading) || 0,
        oilChangeInterval: Number(form.oilChangeInterval) || 0,
        createdBy: currentUser.uid,
      }
      if (isEdit) {
        await updateItem(coll, item.id, data)
        toast.success('تم التحديث بنجاح')
      } else {
        await addItem(coll, data)
        toast.success('تمت الإضافة بنجاح')
      }
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const label = itemType === 'vehicle' ? 'سيارة' : 'معدة'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${isEdit ? 'تعديل' : 'إضافة'} ${label}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">اسم {label} *</label>
            <input name="name" value={form.name} onChange={handleChange}
              className="input-field" placeholder={`اسم ${label}`} required />
          </div>
          <div>
            <label className="label">كود {label}</label>
            <input name="code" value={form.code} onChange={handleChange}
              className="input-field" placeholder="EQ-001" />
          </div>
          <div>
            <label className="label">رقم اللوحة</label>
            <input name="plateNumber" value={form.plateNumber} onChange={handleChange}
              className="input-field" placeholder="أ ب ج 1234" />
          </div>
          <div>
            <label className="label">اسم السائق / المشغّل</label>
            <input name="driver" value={form.driver} onChange={handleChange}
              className="input-field" placeholder="اسم السائق" />
          </div>
        </div>

        {/* Meter */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">نوع العداد</label>
            <select name="meterType" value={form.meterType} onChange={handleChange} className="input-field">
              <option value="km">كيلومترات</option>
              <option value="hours">ساعات تشغيل</option>
            </select>
          </div>
          <div>
            <label className="label">القراءة الحالية</label>
            <input type="number" name="currentReading" value={form.currentReading} onChange={handleChange}
              className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="label">فترة تغيير الزيت</label>
            <input type="number" name="oilChangeInterval" value={form.oilChangeInterval} onChange={handleChange}
              className="input-field" placeholder={form.meterType === 'hours' ? '250 ساعة' : '5000 كم'} />
          </div>
        </div>

        {/* Oil Change */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">قراءة آخر تغيير زيت</label>
            <input type="number" name="lastOilChangeReading" value={form.lastOilChangeReading} onChange={handleChange}
              className="input-field" placeholder="0" />
          </div>
          <div>
            <label className="label">تاريخ آخر تغيير زيت</label>
            <input type="date" name="lastOilChangeDate" value={form.lastOilChangeDate} onChange={handleChange}
              className="input-field" />
          </div>
          <div>
            <label className="label">تاريخ آخر صيانة</label>
            <input type="date" name="lastMaintenanceDate" value={form.lastMaintenanceDate} onChange={handleChange}
              className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">ملاحظات</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            className="input-field h-20 resize-none" placeholder="ملاحظات إضافية..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'جاري الحفظ...' : isEdit ? 'حفظ التغييرات' : `إضافة ${label}`}
          </button>
        </div>
      </form>
    </Modal>
  )
}
