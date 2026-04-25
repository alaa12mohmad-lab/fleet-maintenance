// src/pages/Profile.jsx
import { useState } from 'react'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { updateDoc, doc } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { auth, db } from '../firebase/config'
import { PERMISSION_LABELS } from '../firebase/auth'
import { User, Lock, Shield, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { currentUser, userProfile, isAdmin } = useAuth()

  const [nameForm, setNameForm]     = useState({ displayName: userProfile?.displayName || '' })
  const [pwForm, setPwForm]         = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw]         = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingPw, setSavingPw]     = useState(false)

  // ── Update display name ───────────────────────────────────────
  const handleNameSave = async (e) => {
    e.preventDefault()
    if (!nameForm.displayName.trim()) return toast.error('الاسم مطلوب')
    setSavingName(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: nameForm.displayName.trim(),
      })
      toast.success('تم تحديث الاسم')
    } catch {
      toast.error('فشل التحديث')
    } finally {
      setSavingName(false)
    }
  }

  // ── Change password ───────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.next.length < 8)          return toast.error('كلمة المرور الجديدة 8 أحرف على الأقل')
    if (pwForm.next !== pwForm.confirm)  return toast.error('كلمتا المرور غير متطابقتين')
    setSavingPw(true)
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, pwForm.current)
      await reauthenticateWithCredential(currentUser, cred)
      await updatePassword(currentUser, pwForm.next)
      toast.success('تم تغيير كلمة المرور')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      if (err.code === 'auth/wrong-password') toast.error('كلمة المرور الحالية خاطئة')
      else toast.error('فشل التغيير: ' + err.message)
    } finally {
      setSavingPw(false)
    }
  }

  const ROLE_LABELS = {
    admin:      'مدير النظام',
    manager:    'مدير قسم',
    supervisor: 'مشرف',
    user:       'مستخدم عادي',
  }

  return (
    <div className="max-w-2xl space-y-6 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-primary-400" />
            الملف الشخصي
          </h1>
          <p className="text-slate-400 text-sm">{currentUser?.email}</p>
        </div>
      </div>

      {/* Avatar + Role */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 glow-primary">
          <span className="text-white text-2xl font-bold">
            {(userProfile?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-xl font-bold text-white">{userProfile?.displayName || '—'}</div>
          <div className="text-sm text-slate-400 mt-0.5">{currentUser?.email}</div>
          <div className="mt-2 flex gap-2">
            <span className="badge-blue">{ROLE_LABELS[userProfile?.role] || userProfile?.role}</span>
            {userProfile?.isActive
              ? <span className="badge-green">نشط</span>
              : <span className="badge-red">معطل</span>}
          </div>
        </div>
      </div>

      {/* Update Name */}
      <div className="card">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" /> تعديل الاسم
        </h2>
        <form onSubmit={handleNameSave} className="flex gap-3">
          <input
            value={nameForm.displayName}
            onChange={e => setNameForm({ displayName: e.target.value })}
            className="input-field flex-1"
            placeholder="اسمك الكامل"
          />
          <button type="submit" disabled={savingName} className="btn-primary">
            {savingName ? 'جاري...' : 'حفظ'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" /> تغيير كلمة المرور
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="label">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                className="input-field pl-10"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">كلمة المرور الجديدة</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                className="input-field"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="label">تأكيد كلمة المرور</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary w-full justify-center">
            {savingPw ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>

      {/* Permissions (read-only) */}
      {!isAdmin && userProfile?.permissions && (
        <div className="card">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" /> صلاحياتي
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
              const has = !!userProfile.permissions[key]
              return (
                <div key={key}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                    has
                      ? 'bg-emerald-900/20 border border-emerald-700/30 text-emerald-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  {has
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    : <XCircle    className="w-4 h-4 text-slate-700     flex-shrink-0" />}
                  <span className="leading-tight">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
