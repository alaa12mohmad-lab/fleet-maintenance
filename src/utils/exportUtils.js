// src/utils/exportUtils.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate } from './calculations'

export const exportToExcel = (data, headers, filename) => {
  const ws = XLSX.utils.json_to_sheet(
    data.map(row => {
      const obj = {}
      headers.forEach(h => { obj[h.label] = row[h.key] ?? '—' })
      return obj
    })
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export const exportEquipmentReport = (items, type = 'equipment') => {
  const headers = [
    { key: 'name', label: 'الاسم' },
    { key: 'code', label: 'الكود' },
    { key: 'driver', label: 'السائق' },
    { key: 'currentReading', label: 'القراءة الحالية' },
    { key: 'lastOilChangeReading', label: 'آخر تغيير زيت' },
    { key: 'oilChangeInterval', label: 'فترة تغيير الزيت' },
    { key: 'notes', label: 'ملاحظات' },
  ]
  exportToExcel(items, headers, type === 'vehicle' ? 'تقرير-السيارات' : 'تقرير-المعدات')
}

export const exportMaintenanceReport = (logs) => {
  const headers = [
    { key: 'equipmentName', label: 'المعدة' },
    { key: 'maintenanceType', label: 'نوع الصيانة' },
    { key: 'description', label: 'الوصف' },
    { key: 'date', label: 'التاريخ' },
    { key: 'cost', label: 'التكلفة' },
    { key: 'notes', label: 'ملاحظات' },
  ]
  exportToExcel(logs, headers, 'تقرير-الصيانة')
}
