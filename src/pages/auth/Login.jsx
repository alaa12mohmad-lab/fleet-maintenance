// src/pages/auth/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerInvitedUser } from '../../firebase/auth'
import { Truck, Eye, EyeOff, Lock, Mail, User, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', displayName: '', confirmPassword: '' })

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await loginUser(form.email, form.password)
      navigate('/')
      toast.success('أهلاً بك!')
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/invalid-credential': 'بيانات الدخول غير صحيحة',
        'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً',
      }
      setError(messages[err.code] || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return setError('كلمتا المرور غير متطابقتين')
    if (form.password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    setLoading(true)
    setError('')
    try {
      await registerInvitedUser(form.email, form.password, form.displayName)
      toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني قبل تسجيل الدخول')
      setMode('login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-primary">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">نظام إدارة الأسطول</h1>
          <p className="text-slate-400 text-sm mt-1">Fleet & Equipment Maintenance</p>
        </div>

        {/* Card */}
        <div className="card border-slate-700 shadow-2xl">
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-900 rounded-xl p-1">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'login' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >تسجيل الدخول</button>
            <button
              onClick={() => { setMode('register'); setError('') }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === 'register' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >تفعيل دعوة</button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg mb-4 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    className="input-field pr-10" placeholder="your@email.com" required autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange}
                    className="input-field pr-10 pl-10" placeholder="كلمة المرور" required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base">
                {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl text-sm text-blue-400">
                يجب أن يكون بريدك الإلكتروني في قائمة الدعوات. تواصل مع المدير.
              </div>
              <div>
                <label className="label">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="displayName" value={form.displayName} onChange={handleChange}
                    className="input-field pr-10" placeholder="اسمك الكامل" required />
                </div>
              </div>
              <div>
                <label className="label">البريد الإلكتروني (المدعو)</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    className="input-field pr-10" placeholder="your@email.com" required />
                </div>
              </div>
              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange}
                    className="input-field pr-10 pl-10" placeholder="8 أحرف على الأقل" required minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    className="input-field pr-10" placeholder="أعد كلمة المرور" required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base">
                {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Fleet & Equipment Maintenance Management System © 2024
        </p>
      </div>
    </div>
  )
}
