// src/pages/Equipment.jsx
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeToCollection, deleteItem } from '../firebase/firestore'
import EquipmentCard from '../components/Equipment/EquipmentCard'
import EquipmentForm from '../components/Equipment/EquipmentForm'
import { MeterReadingModal, OilChangeModal } from '../components/Equipment/MeterReadingForm'
import MaintenanceForm from '../components/Maintenance/MaintenanceForm'
import { EmptyState, SearchInput, ConfirmDialog, LoadingSpinner, Pagination } from '../components/Common'
import { exportEquipmentReport } from '../utils/exportUtils'
import { calculateOilStatus } from '../utils/calculations'
import { Wrench, Plus, Download, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 12

export default function EquipmentPage({ itemType = 'equipment' }) {
  const { hasPermission } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [meterTarget, setMeterTarget] = useState(null)
  const [oilTarget, setOilTarget] = useState(null)
  const [maintenanceTarget, setMaintenanceTarget] = useState(null)

  const coll = itemType === 'vehicle' ? 'vehicles' : 'equipments'
  const label = itemType === 'vehicle' ? 'سيارة' : 'معدة'
  const icon = itemType === 'vehicle' ? '🚗' : '⚙️'

  useEffect(() => {
    const unsub = subscribeToCollection(coll, (data) => {
      setItems(data)
      setLoading(false)
    })
    return unsub
  }, [coll])

  const filtered = useMemo(() => {
    let result = items
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.code?.toLowerCase().includes(q) ||
        i.driver?.toLowerCase().includes(q) ||
        i.plateNumber?.toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') {
      result = result.filter(i => {
        const s = calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading)
        return s.status === filterStatus
      })
    }
    return result
  }, [items, search, filterStatus])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteItem(coll, deleteTarget.id)
      toast.success('تم الحذف')
      setDeleteTarget(null)
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handleEdit = (item) => { setEditItem(item); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditItem(null) }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white">{icon} {itemType === 'vehicle' ? 'السيارات' : 'المعدات'}</h1>
          <p className="text-slate-400 text-sm">{items.length} {label} مسجلة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportEquipmentReport(items, itemType)} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
          {hasPermission('addEquipment') && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> إضافة {label}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder={`بحث في ${itemType === 'vehicle' ? 'السيارات' : 'المعدات'}...`} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="input-field w-auto"
          >
            <option value="all">جميع الحالات</option>
            <option value="ok">زيت جيد</option>
            <option value="warning">قريب من التغيير</option>
            <option value="overdue">متجاوز الموعد</option>
            <option value="unknown">غير محدد</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      {items.length > 0 && (
        <div className="flex gap-4 text-sm text-slate-400">
          <span>إجمالي: <strong className="text-white">{filtered.length}</strong></span>
          <span className="text-emerald-400">جيد: <strong>{items.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'ok').length}</strong></span>
          <span className="text-amber-400">قريب: <strong>{items.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'warning').length}</strong></span>
          <span className="text-red-400">متجاوز: <strong>{items.filter(i => calculateOilStatus(i.lastOilChangeReading, i.oilChangeInterval, i.currentReading).status === 'overdue').length}</strong></span>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={search ? 'لا نتائج' : `لا توجد ${itemType === 'vehicle' ? 'سيارات' : 'معدات'}`}
          message={search ? 'حاول تغيير كلمة البحث' : `أضف أول ${label} للبدء`}
          action={hasPermission('addEquipment') && !search ? (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> إضافة {label}
            </button>
          ) : null}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(item => (
              <EquipmentCard
                key={item.id}
                item={item}
                itemType={itemType}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onMeterReading={setMeterTarget}
                onOilChange={setOilTarget}
                onMaintenance={setMaintenanceTarget}
                canEdit={hasPermission('editEquipment')}
                canDelete={hasPermission('deleteEquipment')}
              />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Modals */}
      <EquipmentForm isOpen={showForm} onClose={closeForm} item={editItem} itemType={itemType} />
      <MeterReadingModal isOpen={!!meterTarget} onClose={() => setMeterTarget(null)} item={meterTarget} itemType={itemType} />
      <OilChangeModal isOpen={!!oilTarget} onClose={() => setOilTarget(null)} item={oilTarget} itemType={itemType} />
      <MaintenanceForm isOpen={!!maintenanceTarget} onClose={() => setMaintenanceTarget(null)} item={maintenanceTarget} allEquipment={itemType === 'equipment' ? items : []} allVehicles={itemType === 'vehicle' ? items : []} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع.`}
      />
    </div>
  )
}
