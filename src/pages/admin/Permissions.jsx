// src/pages/admin/Permissions.jsx
import { useState, useEffect } from 'react'
import { getAllUsers, updateUserPermissions } from '../../firebase/firestore'
import { PERMISSION_LABELS } from '../../firebase/auth'
import { LoadingSpinner } from '../../components/Common'
import { Shield, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const ADMIN_EMAIL = 'alaa12mohmad@gmail.com'

export default function Permissions() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // userId being saved
  const [edited, setEdited] = useState({}) // { [userId]: { permissions, role } }

  const load = () => {
    getAllUsers()
      .then(data => {
        const nonAdmin = data.filter(u => u.email !== ADMIN_EMAIL)
        setUsers(nonAdmin)
        // Init edited state from current permissions
        const initEdits = {}
        nonAdmin.forEach(u => {
          initEdits[u.id] = {
            permissions: { ...u.permissions },
            role: u.role || 'user',
          }
        })
        setEdited(initEdits)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const togglePerm = (userId, perm) => {
    setEdited(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        permissions: {
          ...prev[userId]?.permissions,
          [perm]: !prev[userId]?.permissions?.[perm],
        },
      },
    }))
  }

  const setRole = (userId, role) => {
    setEdited(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role },
    }))
  }

  const handleSave = async (userId) => {
    setSaving(userId)
    try {
      const data = edited[userId]
      await updateUserPermissions(userId, data.permissions, data.role)
      toast.success('تم حفظ الصلاحيات')
    } catch {
      toast.error('فشل الحفظ')
    } finally {
      setSaving(null)
    }
  }

  const ROLE_LABELS = {
    user: 'مستخدم عادي',
    supervisor: 'مشرف',
    manager: 'مدير قسم',
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-400" />
            إدارة الصلاحيات
          </h1>
          <p className="text-slate-400 text-sm">
            تحكم كامل بصلاحيات كل مستخدم
          </p>
        </div>
        <button onClick={load} className="btn-ghost text-sm">
          <RefreshCw className="w-4 h-4" /> تحديث
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا يوجد مستخدمون بعد. أرسل دعوات أولاً.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(user => {
            const userEdit = edited[user.id] || { permissions: {}, role: 'user' }
            const isSaving = saving === user.id

            return (
              <div key={user.id} className="card border border-slate-700 space-y-4">
                {/* User Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {(user.displayName || user.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.displayName || '—'}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">الدور:</label>
                      <select
                        value={userEdit.role}
                        onChange={e => setRole(user.id, e.target.value)}
                        className="input-field w-auto text-sm py-1.5"
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status badge */}
                    {user.isActive
                      ? <span className="badge-green">نشط</span>
                      : <span className="badge-red">معطل</span>
                    }

                    {/* Save button */}
                    <button
                      onClick={() => handleSave(user.id)}
                      disabled={isSaving}
                      className="btn-primary text-sm py-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'جاري...' : 'حفظ'}
                    </button>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                    const isOn = !!userEdit.permissions?.[key]
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border transition-all ${
                          isOn
                            ? 'bg-primary-900/30 border-primary-600/50 text-primary-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => togglePerm(user.id, key)}
                          className="w-4 h-4 accent-primary-500 flex-shrink-0"
                        />
                        <span className="text-xs font-medium leading-tight">{label}</span>
                      </label>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      const allOn = {}
                      Object.keys(PERMISSION_LABELS).forEach(k => { allOn[k] = true })
                      setEdited(prev => ({ ...prev, [user.id]: { ...prev[user.id], permissions: allOn } }))
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    ✅ تفعيل الكل
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    onClick={() => {
                      const allOff = {}
                      Object.keys(PERMISSION_LABELS).forEach(k => { allOff[k] = false })
                      setEdited(prev => ({ ...prev, [user.id]: { ...prev[user.id], permissions: allOff } }))
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    ❌ إلغاء الكل
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
