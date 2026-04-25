// src/components/Layout/Header.jsx
import { useState } from 'react'
import { Menu, Bell, LogOut, Sun, Moon, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../firebase/auth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Header({ onMenuToggle, alerts = [] }) {
  const { userProfile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login')
      toast.success('تم تسجيل الخروج')
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const urgentAlerts = alerts.filter(a => a.type === 'danger').length

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="btn-ghost p-2 lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold text-slate-300 hidden sm:block">
          نظام إدارة الأسطول والمعدات
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative btn-ghost p-2"
        >
          <Bell className="w-5 h-5" />
          {urgentAlerts > 0 && (
            <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {urgentAlerts > 9 ? '9+' : urgentAlerts}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 btn-ghost px-3 py-2"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {(userProfile?.displayName || 'U')[0]}
              </span>
            </div>
            <span className="text-sm font-medium hidden sm:block">{userProfile?.displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-700">
                  <div className="text-sm font-semibold text-white">{userProfile?.displayName}</div>
                  <div className="text-xs text-slate-500">{isAdmin ? 'مدير النظام' : 'مستخدم'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
