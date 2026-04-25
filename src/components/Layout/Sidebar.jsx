// src/components/Layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Truck, Wrench, Droplets, FileText,
  Bell, BarChart2, Users, Mail, Settings, X, Shield,
  Gauge, User
} from 'lucide-react'

const navItems = [
  { to: '/',              label: 'لوحة التحكم',    icon: LayoutDashboard, perm: null },
  { to: '/equipment',     label: 'المعدات',          icon: Wrench,          perm: null },
  { to: '/vehicles',      label: 'السيارات',         icon: Truck,           perm: null },
  { to: '/maintenance',   label: 'سجل الصيانة',     icon: Settings,        perm: null },
  { to: '/oil-changes',   label: 'تغيير الزيت',     icon: Droplets,        perm: null },
  { to: '/meter-readings',label: 'قراءات العداد',   icon: Gauge,           perm: null },
  { to: '/documents',     label: 'المستندات',        icon: FileText,        perm: null },
  { to: '/alerts',        label: 'التنبيهات',        icon: Bell,            perm: 'viewAlerts' },
  { to: '/reports',       label: 'التقارير',         icon: BarChart2,       perm: 'viewReports' },
  { to: '/profile',       label: 'ملفي الشخصي',     icon: User,            perm: null },
]

const adminItems = [
  { to: '/admin/users', label: 'المستخدمون', icon: Users },
  { to: '/admin/invitations', label: 'الدعوات', icon: Mail },
  { to: '/admin/permissions', label: 'الصلاحيات', icon: Shield },
]

export default function Sidebar({ open, onClose, alertCount = 0 }) {
  const { isAdmin, hasPermission, userProfile } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-700 z-40
        flex flex-col transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center glow-primary">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">إدارة الأسطول</div>
              <div className="text-xs text-slate-500">Fleet Management</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, perm }) => {
            if (perm && !hasPermission(perm)) return null
            const isBell = to === '/alerts'
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5" />
                  {isBell && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold leading-none">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </NavLink>
            )
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">إدارة النظام</div>
              </div>
              {adminItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {(userProfile?.displayName || 'U')[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {userProfile?.displayName || 'المستخدم'}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {isAdmin ? 'مدير النظام' : 'مستخدم'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
