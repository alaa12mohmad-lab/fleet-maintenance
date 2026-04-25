// src/utils/calculations.js

/**
 * حساب حالة الزيت
 */
export const calculateOilStatus = (lastOilChangeReading, oilChangeInterval, currentReading) => {
  if (!lastOilChangeReading || !oilChangeInterval || currentReading === undefined) {
    return { status: 'unknown', remaining: null, percentage: 0, label: 'غير محدد' }
  }

  const nextChangeAt = Number(lastOilChangeReading) + Number(oilChangeInterval)
  const remaining = nextChangeAt - Number(currentReading)
  const percentage = Math.max(0, Math.min(100, (remaining / Number(oilChangeInterval)) * 100))

  if (remaining <= 0) {
    return { status: 'overdue', remaining, percentage: 0, label: 'متجاوز', nextChangeAt }
  } else if (percentage <= 20) {
    return { status: 'warning', remaining, percentage, label: 'قريب', nextChangeAt }
  } else {
    return { status: 'ok', remaining, percentage, label: 'جيد', nextChangeAt }
  }
}

/**
 * حساب حالة الوثيقة
 */
export const calculateDocumentStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'unknown', daysLeft: null }
  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return { status: 'expired', daysLeft }
  if (daysLeft <= 7) return { status: 'critical', daysLeft }
  if (daysLeft <= 30) return { status: 'warning', daysLeft }
  return { status: 'ok', daysLeft }
}

// ─── Date Utilities ────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const getRelativeTime = (date) => {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days < 7) return `منذ ${days} أيام`
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`
  return formatDate(date)
}

export const toInputDate = (date) => {
  if (!date) return ''
  const d = date?.toDate ? date.toDate() : new Date(date)
  return d.toISOString().split('T')[0]
}
