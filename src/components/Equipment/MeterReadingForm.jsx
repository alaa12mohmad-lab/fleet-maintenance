// src/components/Equipment/MeterReadingForm.jsx
import { useState } from 'react'
import { Modal, ProgressBar } from '../Common'
import { addMeterReading, recordOilChange } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { calculateOilStatus } from '../../utils/calculations'
import toast from 'react-hot-toast'
import { Gauge, Droplets } from 'lucide-react'

export function MeterReadingModal({ isOpen, onClose, item, itemType }) {
  const { currentUser } = useAuth()
  const [reading, setReading] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const unit = item?.meterType === 'hours' ? 'ساعة' : 'كم'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reading) return toast.error('أدخل القراءة')
    if (Number(reading) < Number(item?.currentReading || 0)) {
      return toast.error('القراءة الجديدة يجب أن تكون أكبر من القراءة الحالية')
    }
    setLoading(true)
    try {
      await addMeterReading(item.id, itemType, reading, notes, currentUser.uid)
      toast.success('تم تسجيل القراءة بنجاح')
      setReading('')
      setNotes('')
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  const oilStatus = calculateOilStatus(item.lastOilChangeReading, item.oilChangeInterval, Number(reading) || item.currentReading)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إدخال قراءة عداد" size="md">
      <div className="mb-4 p-3 bg-slate-900 rounded-xl">
        <div className="text-sm text-slate-400">القراءة الحالية</div>
        <div className="text-2xl font-bold text-white">{item.currentReading?.toLocaleString() || 0} {unit}</div>
        <div className="text-sm text-slate-500">{item.name}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">القراءة الجديدة ({unit}) *</label>
          <input
            type="number"
            value={reading}
            onChange={(e) => setReading(e.target.value)}
            className="input-field text-xl font-bold"
            placeholder={`أدخل القراءة بالـ${unit}`}
            required
          />
        </div>

        {reading && item.oilChangeInterval && (
          <div className="p-3 bg-slate-900 rounded-xl space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase">معاينة حالة الزيت بعد التحديث</div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">المتبقي لتغيير الزيت</span>
              <span className={`font-bold ${oilStatus.remaining <= 0 ? 'text-red-400' : oilStatus.percentage <= 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {oilStatus.remaining?.toLocaleString()} {unit}
              </span>
            </div>
            <ProgressBar percentage={oilStatus.percentage} status={oilStatus.status} />
          </div>
        )}

        <div>
          <label className="label">ملاحظات</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field h-16 resize-none"
            placeholder="ملاحظات اختيارية..."
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <Gauge className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'تسجيل القراءة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function OilChangeModal({ isOpen, onClose, item, itemType }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ reading: '', date: new Date().toISOString().split('T')[0], notes: '' })
  const [loading, setLoading] = useState(false)

  const unit = item?.meterType === 'hours' ? 'ساعة' : 'كم'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.reading) return toast.error('أدخل قراءة العداد')
    setLoading(true)
    try {
      await recordOilChange(item.id, itemType, form, currentUser.uid)
      toast.success('تم تسجيل تغيير الزيت')
      setForm({ reading: '', date: new Date().toISOString().split('T')[0], notes: '' })
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل تغيير زيت" size="md">
      <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl flex items-center gap-3">
        <Droplets className="w-8 h-8 text-amber-400 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-amber-300">{item.name}</div>
          <div className="text-xs text-amber-600">آخر تغيير: {item.lastOilChangeReading?.toLocaleString() || 0} {unit}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">قراءة العداد الحالية ({unit}) *</label>
            <input
              type="number"
              value={form.reading}
              onChange={(e) => setForm(p => ({ ...p, reading: e.target.value }))}
              className="input-field"
              placeholder={item.currentReading?.toLocaleString()}
              required
            />
          </div>
          <div>
            <label className="label">تاريخ التغيير</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>
        <div>
          <label className="label">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
            className="input-field h-16 resize-none"
            placeholder="نوع الزيت، الكمية، ملاحظات..."
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <Droplets className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'تسجيل تغيير الزيت'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
