// src/pages/admin/Invitations.jsx
import { useState, useEffect } from 'react'
import { getInvitations, deleteItem } from '../../firebase/firestore'
import { InviteForm } from '../../components/Admin/AdminForms'
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/Common'
import { Mail, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '../../utils/calculations'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'بانتظار القبول', badge: 'badge-yellow', icon: Clock },
  accepted: { label: 'تم القبول', badge: 'badge-green', icon: CheckCircle },
  rejected: { label: 'مرفوض', badge: 'badge-red', icon: XCircle },
}

export default function Invitations() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => getInvitations().then(data => {
    setInvitations(data.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
    setLoading(false)
  }).catch(()=>setLoading(false))

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    try {
      await deleteItem('invitations', deleteTarget.id)
      toast.success('تم حذف الدعوة')
      setDeleteTarget(null)
      load()
    } catch { toast.error('فشل الحذف') }
  }

  if (loading) return <LoadingSpinner />

  const pending = invitations.filter(i=>i.status==='pending').length
  const accepted = invitations.filter(i=>i.status==='accepted').length

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Mail className="w-6 h-6"/> الدعوات</h1>
          <p className="text-slate-400 text-sm">{pending} بانتظار • {accepted} تم قبولهم</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4"/> دعوة مستخدم
        </button>
      </div>

      {invitations.length === 0 ? (
        <EmptyState icon={Mail} title="لا توجد دعوات" message="ابدأ بدعوة مستخدمين للنظام"
          action={<button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/> دعوة مستخدم</button>} />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-right">البريد الإلكتروني</th>
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">الدور</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">تاريخ الدعوة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending
                  const StatusIcon = cfg.icon
                  const ROLE_LABELS = { user:'مستخدم عادي', supervisor:'مشرف', manager:'مدير قسم' }
                  return (
                    <tr key={inv.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <Mail className="w-4 h-4 text-slate-400"/>
                          </div>
                          <span className="text-sm text-white font-mono">{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{inv.displayName || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{ROLE_LABELS[inv.role] || inv.role}</td>
                      <td className="px-4 py-3">
                        <span className={cfg.badge}><StatusIcon className="w-3 h-3"/>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3">
                        {inv.status === 'pending' && (
                          <button onClick={()=>setDeleteTarget(inv)} className="text-red-400 hover:text-red-300 p-1">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteForm isOpen={showForm} onClose={()=>{setShowForm(false);load()}} />
      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}
        title="إلغاء الدعوة" message={`هل تريد إلغاء دعوة ${deleteTarget?.email}؟`} />
    </div>
  )
}
