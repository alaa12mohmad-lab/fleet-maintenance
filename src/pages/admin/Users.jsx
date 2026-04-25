// src/pages/admin/Users.jsx
import { useState, useEffect } from 'react'
import { getAllUsers, toggleUserStatus, updateUserPermissions } from '../../firebase/firestore'
import { PERMISSION_LABELS, getDefaultPermissions } from '../../firebase/auth'
import { Modal } from '../../components/Common'
import { LoadingSpinner } from '../../components/Common'
import { Users, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatDate } from '../../utils/calculations'
import toast from 'react-hot-toast'

function PermissionsModal({ isOpen, onClose, user }) {
  const [permissions, setPermissions] = useState({})
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) { setPermissions(user.permissions || getDefaultPermissions()); setRole(user.role || 'user') }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateUserPermissions(user.id, permissions, role)
      toast.success('تم تحديث الصلاحيات')
      onClose()
    } catch { toast.error('حدث خطأ') }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`صلاحيات: ${user?.displayName || ''}`} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label">الدور</label>
          <select value={role} onChange={e=>setRole(e.target.value)} className="input-field">
            <option value="user">مستخدم عادي</option>
            <option value="supervisor">مشرف</option>
            <option value="manager">مدير قسم</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PERMISSION_LABELS).map(([key,label]) => (
            <label key={key} className="flex items-center gap-2.5 p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800">
              <input type="checkbox" checked={!!permissions[key]} onChange={()=>setPermissions(p=>({...p,[key]:!p[key]}))} className="w-4 h-4 accent-primary-500"/>
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [permTarget, setPermTarget] = useState(null)

  const loadUsers = () => getAllUsers().then(data => { setUsers(data); setLoading(false) }).catch(()=>setLoading(false))

  useEffect(() => { loadUsers() }, [])

  const handleToggle = async (user) => {
    try {
      await toggleUserStatus(user.id, !user.isActive)
      toast.success(user.isActive ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
      loadUsers()
    } catch { toast.error('حدث خطأ') }
  }

  const ROLE_LABELS = { admin:'مدير النظام', manager:'مدير قسم', supervisor:'مشرف', user:'مستخدم عادي' }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6"/> المستخدمون</h1>
          <p className="text-slate-400 text-sm">{users.length} مستخدم مسجل</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-right">المستخدم</th>
                <th className="px-4 py-3 text-right">الدور</th>
                <th className="px-4 py-3 text-right">الحالة</th>
                <th className="px-4 py-3 text-right">آخر دخول</th>
                <th className="px-4 py-3 text-right">تاريخ الإنشاء</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">{(user.displayName||'?')[0]}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{user.displayName || '—'}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{ROLE_LABELS[user.role] || user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? <span className="badge-green">نشط</span> : <span className="badge-red">معطل</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(user.lastLogin) || 'لم يدخل بعد'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={()=>setPermTarget(user)} className="btn-ghost p-1.5 text-xs">
                        <Shield className="w-4 h-4"/>
                      </button>
                      <button onClick={()=>handleToggle(user)} className={`p-1.5 rounded-lg transition-colors ${user.isActive?'text-amber-400 hover:bg-amber-900/20':'text-emerald-400 hover:bg-emerald-900/20'}`}>
                        {user.isActive ? <ToggleRight className="w-5 h-5"/> : <ToggleLeft className="w-5 h-5"/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PermissionsModal isOpen={!!permTarget} onClose={()=>{setPermTarget(null);loadUsers()}} user={permTarget} />
    </div>
  )
}
