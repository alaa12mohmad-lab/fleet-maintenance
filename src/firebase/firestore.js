// src/firebase/firestore.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── Equipment & Vehicles ──────────────────────────────────────
export const addItem = (collectionName, data) =>
  addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

export const updateItem = (collectionName, id, data) =>
  updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() })

export const deleteItem = (collectionName, id) =>
  deleteDoc(doc(db, collectionName, id))

export const getItem = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const getCollection = async (collectionName, conditions = []) => {
  let q = collection(db, collectionName)
  if (conditions.length) q = query(q, ...conditions)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const subscribeToCollection = (collectionName, callback, conditions = []) => {
  let q = collection(db, collectionName)
  if (conditions.length) q = query(q, ...conditions)
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

// ─── Meter Readings ────────────────────────────────────────────
export const addMeterReading = async (equipmentId, equipmentType, reading, notes, userId) => {
  // إضافة سجل القراءة
  await addDoc(collection(db, 'meter_readings'), {
    equipmentId,
    equipmentType,
    reading: Number(reading),
    notes,
    recordedBy: userId,
    createdAt: serverTimestamp(),
  })

  // تحديث القراءة الحالية في المعدة
  const coll = equipmentType === 'vehicle' ? 'vehicles' : 'equipments'
  await updateItem(coll, equipmentId, {
    currentReading: Number(reading),
    lastReadingDate: serverTimestamp(),
  })
}

// ─── Oil Changes ───────────────────────────────────────────────
export const recordOilChange = async (equipmentId, equipmentType, data, userId) => {
  await addDoc(collection(db, 'oil_changes'), {
    equipmentId,
    equipmentType,
    reading: Number(data.reading),
    date: data.date,
    notes: data.notes || '',
    recordedBy: userId,
    createdAt: serverTimestamp(),
  })

  const coll = equipmentType === 'vehicle' ? 'vehicles' : 'equipments'
  await updateItem(coll, equipmentId, {
    lastOilChangeReading: Number(data.reading),
    lastOilChangeDate: data.date,
  })
}

// ─── Maintenance ───────────────────────────────────────────────
export const addMaintenanceLog = async (data, userId) => {
  return addDoc(collection(db, 'maintenance_logs'), {
    ...data,
    cost: Number(data.cost || 0),
    meterReading: Number(data.meterReading || 0),
    recordedBy: userId,
    createdAt: serverTimestamp(),
  })
}

// ─── Documents ────────────────────────────────────────────────
export const addDocument = async (data, userId) => {
  return addDoc(collection(db, 'documents'), {
    ...data,
    uploadedBy: userId,
    createdAt: serverTimestamp(),
  })
}

// ─── Alerts ───────────────────────────────────────────────────
export const generateAlerts = async (allEquipment, allVehicles, allDocuments) => {
  const alerts = []
  const today = new Date()

  // تنبيهات زيت المعدات والسيارات
  const allItems = [
    ...allEquipment.map(e => ({ ...e, _type: 'equipment' })),
    ...allVehicles.map(v => ({ ...v, _type: 'vehicle' })),
  ]

  for (const item of allItems) {
    if (!item.lastOilChangeReading || !item.oilChangeInterval || !item.currentReading) continue
    const remaining = (item.lastOilChangeReading + item.oilChangeInterval) - item.currentReading
    const unit = item.meterType === 'hours' ? 'ساعة' : 'كم'

    if (remaining <= 0) {
      alerts.push({
        type: 'danger',
        category: 'oil_change',
        title: 'تجاوز موعد تغيير الزيت',
        message: `${item.name} - تجاوز الموعد بـ ${Math.abs(remaining)} ${unit}`,
        itemId: item.id,
        itemType: item._type,
        itemName: item.name,
      })
    } else if (remaining <= 500) {
      alerts.push({
        type: 'warning',
        category: 'oil_change',
        title: 'اقتراب موعد تغيير الزيت',
        message: `${item.name} - متبقي ${remaining} ${unit}`,
        itemId: item.id,
        itemType: item._type,
        itemName: item.name,
      })
    }
  }

  // تنبيهات المستندات
  for (const doc of allDocuments) {
    if (!doc.expiryDate) continue
    const expiry = new Date(doc.expiryDate)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      alerts.push({
        type: 'danger',
        category: 'document',
        title: 'وثيقة منتهية الصلاحية',
        message: `${doc.name} - انتهت منذ ${Math.abs(diffDays)} يوم`,
        itemId: doc.id,
        itemName: doc.name,
      })
    } else if (diffDays <= 30) {
      alerts.push({
        type: 'warning',
        category: 'document',
        title: 'وثيقة تنتهي قريباً',
        message: `${doc.name} - تنتهي خلال ${diffDays} يوم`,
        itemId: doc.id,
        itemName: doc.name,
      })
    }
  }

  return alerts
}

// ─── Users ────────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const getAllUsers = () => getCollection('users')
export const getInvitations = () => getCollection('invitations')

export const addInvitation = (data, adminUid) =>
  addDoc(collection(db, 'invitations'), {
    ...data,
    email: data.email.toLowerCase(),
    status: 'pending',
    invitedBy: adminUid,
    createdAt: serverTimestamp(),
  })

export const updateUserPermissions = (userId, permissions, role) =>
  updateItem('users', userId, { permissions, role })

export const toggleUserStatus = (userId, isActive) =>
  updateItem('users', userId, { isActive })
