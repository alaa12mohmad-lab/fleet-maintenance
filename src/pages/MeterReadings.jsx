// src/pages/MeterReadings.jsx
import { useState, useEffect } from 'react'
import { subscribeToCollection } from '../firebase/firestore'
import { useOutletContext } from 'react-router-dom'
import { SearchInput, EmptyState, LoadingSpinner, Pagination } from '../components/Common'
import { Gauge, TrendingUp } from 'lucide-react'
import { formatDateTime } from '../utils/calculations'
import * as XLSX from 'xlsx'

const PER_PAGE = 20

export default function MeterReadings() {
  const { equipment = [], vehicles = [] } = useOutletContext() || {}
  const [readings, setReadings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  useEffect(() => {
    const unsub = subscribeToCollection('meter_readings', data => {
      setReadings(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setLoading(false)
    })
    return unsub
  }, [])

  // Enrich each reading with the item name
  const allItems = [
    ...equipment.map(e => ({ ...e, _type: 'equipment' })),
    ...vehicles.map(v => ({ ...v, _type: 'vehicle' })),
  ]
  const findName = (id) => allItems.find(i => i.id === id)?.name || id

  const filtered = readings.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return findName(r.equipmentId).toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const exportExcel = () => {
    const data = filtered.map(r => ({
      'المعدة / السيارة': findName(r.equipmentId),
      'النوع':            r.equipmentType === 'vehicle' ? 'سيارة' : 'معدة',
      'القراءة':          r.reading,
      'التاريخ':          r.createdAt?.toDate?.()?.toLocaleString('ar-SA') || '',
      'ملاحظات':          r.notes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'قراءات العداد')
    XLSX.writeFile(wb, 'سجل-قراءات-العداد.xlsx')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5 animate-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gauge className="w-6 h-6 text-blue-400" />
            سجل قراءات العداد
          </h1>
          <p className="text-slate-400 text-sm">{readings.length} قراءة مسجّلة</p>
        </div>
        <button onClick={exportExcel} className="btn-secondary text-sm">
          تصدير Excel
        </button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الملاحظة..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="لا توجد قراءات"
          message="ستظهر قراءات العداد هنا بعد إدخالها من صفحة المعدات"
        />
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-right">#</th>
                    <th className="px-4 py-3 text-right">المعدة / السيارة</th>
                    <th className="px-4 py-3 text-right">النوع</th>
                    <th className="px-4 py-3 text-right">القراءة</th>
                    <th className="px-4 py-3 text-right">التاريخ والوقت</th>
                    <th className="px-4 py-3 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, idx) => (
                    <tr key={r.id} className="table-row">
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white text-sm">
                          {findName(r.equipmentId)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={r.equipmentType === 'vehicle' ? 'badge-blue' : 'badge-green'}>
                          {r.equipmentType === 'vehicle' ? '🚗 سيارة' : '⚙️ معدة'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-white">
                            {Number(r.reading).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm truncate max-w-[180px]">
                        {r.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
