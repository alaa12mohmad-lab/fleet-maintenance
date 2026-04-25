// src/pages/Maintenance.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { subscribeToCollection, deleteItem } from '../firebase/firestore'
import MaintenanceForm from '../components/Maintenance/MaintenanceForm'
import { SearchInput, EmptyState, ConfirmDialog, LoadingSpinner, Pagination } from '../components/Common'
import { Wrench, Plus, Trash2 } from 'lucide-react'
import { formatDate } from '../utils/calculations'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const ITEMS_PER_PAGE = 15

export default function Maintenance() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const { hasPermission } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const unsub = subscribeToCollection('maintenance_logs', (data) => {
      setLogs(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.equipmentName?.toLowerCase().includes(q) || l.maintenanceType?.toLowerCase().includes(q) || l.workshop?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalCost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0)

  const handleDelete = async () => {
    try { await deleteItem('maintenance_logs', deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null) }
    catch { toast.error('فشل الحذف') }
  }

  const exportExcel = () => {
    const data = filtered.map(l => ({
      'المعدة': l.equipmentName, 'نوع الصيانة': l.maintenanceType, 'التاريخ': l.date,
      'قراءة العداد': l.meterReading, 'التكلفة': l.cost, 'الورشة': l.workshop, 'الوصف': l.description,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'سجل الصيانة')
    XLSX.writeFile(wb, 'سجل-الصيانة.xlsx')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white">سجل الصيانة</h1>
          <p className="text-slate-400 text-sm">{logs.length} سجل • إجمالي التكاليف: <span className="text-emerald-400 font-semibold">{totalCost.toLocaleString()} ر.س</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary text-sm">تصدير Excel</button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> إضافة سجل
          </button>
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="بحث بالمعدة أو نوع الصيانة..." />

      {filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="لا توجد سجلات صيانة" message="ابدأ بإضافة أول سجل صيانة"
          action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> إضافة سجل</button>} />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">المعدة</th>
                    <th className="px-4 py-3 text-right">نوع الصيانة</th>
                    <th className="px-4 py-3 text-right">التاريخ</th>
                    <th className="px-4 py-3 text-right">العداد</th>
                    <th className="px-4 py-3 text-right">التكلفة</th>
                    <th className="px-4 py-3 text-right">الورشة</th>
                    <th className="px-4 py-3 text-right">الوصف</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(log => (
                    <tr key={log.id} className="table-row">
                      <td className="px-4 py-3 font-semibold text-white text-sm">{log.equipmentName || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">
                        <span className="bg-primary-900/40 text-primary-400 px-2 py-0.5 rounded text-xs">{log.maintenanceType}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{log.date || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{log.meterReading ? Number(log.meterReading).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {log.cost > 0 ? <span className="text-emerald-400 font-semibold">{Number(log.cost).toLocaleString()} ر.س</span> : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{log.workshop || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">{log.description || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteTarget(log)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      <MaintenanceForm isOpen={showForm} onClose={() => setShowForm(false)} allEquipment={equipment} allVehicles={vehicles} />
      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        title="حذف السجل" message="هل أنت متأكد من حذف هذا السجل؟" />
    </div>
  )
}
