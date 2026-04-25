// src/components/Admin/InviteForm.jsx
import { useState, useEffect } from 'react'
import { Modal } from '../Common'
import { addInvitation } from '../../firebase/firestore'
import { PERMISSION_LABELS, getDefaultPermissions } from '../../firebase/auth'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Mail, Send } from 'lucide-react'

export function InviteForm({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', displayName: '', role: 'user', permissions: getDefaultPermissions() })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email) return toast.error('البريد الإلكتروني مطلوب')
    setLoading(true)
    try {
      await addInvitation({ email: form.email, displayName: form.displayName, role: form.role, permissions: form.permissions }, currentUser.uid)
      toast.success(`تم إرسال الدعوة إلى ${form.email}`)
      setForm({ email: '', displayName: '', role: 'user', permissions: getDefaultPermissions() })
      onClose()
    } catch (err) {
      toast.error('حدث خطأ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePerm = (perm) => {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] } }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="دعوة مستخدم جديد" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">البريد الإلكتروني *</label>
            <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="input-field" placeholder="user@example.com" required />
          </div>
          <div>
            <label className="label">الاسم</label>
            <input value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))}
              className="input-field" placeholder="اسم المستخدم" />
          </div>
          <div className="col-span-2">
            <label className="label">الدور</label>
            <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))} className="input-field">
              <option value="user">مستخدم عادي</option>
              <option value="supervisor">مشرف</option>
              <option value="manager">مدير قسم</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label mb-3">الصلاحيات</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={form.permissions[key] || false}
                  onChange={() => togglePerm(key)}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
            <Send className="w-4 h-4" />
            {loading ? 'جاري الإرسال...' : 'إرسال الدعوة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Permissions Matrix (used from Users page) ─────────────────
export function PermissionsMatrix({ isOpen, onClose, user, onSave }) {
  const [permissions, setPermissions] = useState(user?.permissions || getDefaultPermissions())
  const [role, setRole] = useState(user?.role || 'user')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setPermissions(user.permissions || getDefaultPermissions())
      setRole(user.role || 'user')
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (onSave) await onSave(user.id, permissions, role)
      toast.success('تم تحديث الصلاحيات')
      onClose()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`صلاحيات: ${user?.displayName || ''}`} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label">الدور</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
            <option value="user">مستخدم عادي</option>
            <option value="supervisor">مشرف</option>
            <option value="manager">مدير قسم</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={permissions[key] || false}
                onChange={() => setPermissions(p => ({ ...p, [key]: !p[key] }))}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
