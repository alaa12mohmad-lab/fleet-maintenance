// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs
} from 'firebase/firestore'
import { auth, db } from './config'

export const ADMIN_EMAIL = 'alaa12mohmad@gmail.com'

// ─── تسجيل الدخول ─────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // تحديث آخر تسجيل دخول
  try {
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date(),
      emailVerified: user.emailVerified,
    })
  } catch {}

  return user
}

// ─── تسجيل الخروج ─────────────────────────────────────────────
export const logoutUser = () => signOut(auth)

// ─── تسجيل مستخدم مدعو ────────────────────────────────────────
export const registerInvitedUser = async (email, password, displayName) => {
  // التحقق من وجود دعوة
  const invRef = collection(db, 'invitations')
  const q = query(
    invRef,
    where('email', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  )
  const snap = await getDocs(q)

  if (snap.empty) {
    throw new Error('لا توجد دعوة لهذا البريد الإلكتروني. تواصل مع المدير')
  }

  const invDoc = snap.docs[0]
  const invitation = invDoc.data()

  // إنشاء الحساب في Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // إنشاء ملف المستخدم في Firestore فوراً
  await setDoc(doc(db, 'users', user.uid), {
    uid:          user.uid,
    email:        user.email,
    displayName:  displayName || email.split('@')[0],
    role:         invitation.role || 'user',
    permissions:  invitation.permissions || getDefaultPermissions(),
    isActive:     true,
    emailVerified: false,
    createdAt:    new Date(),
    lastLogin:    null,
    invitedBy:    invitation.invitedBy || '',
  })

  // تحديث حالة الدعوة
  await updateDoc(doc(db, 'invitations', invDoc.id), {
    status:     'accepted',
    acceptedAt: new Date(),
    userId:     user.uid,
  })

  // إرسال بريد التحقق
  try { await sendEmailVerification(user) } catch {}

  // تسجيل الخروج حتى يتحقق من الإيميل
  await signOut(auth)
  return user
}

// ─── الصلاحيات الافتراضية ──────────────────────────────────────
export const getDefaultPermissions = () => ({
  addEquipment:     false,
  editEquipment:    false,
  deleteEquipment:  false,
  enterMeterReading: true,
  editReadings:     false,
  addDocuments:     false,
  viewReports:      true,
  viewAlerts:       true,
  manageDocuments:  false,
  editUsers:        false,
})

// ─── صلاحيات المدير ───────────────────────────────────────────
export const getAdminPermissions = () => ({
  addEquipment:     true,
  editEquipment:    true,
  deleteEquipment:  true,
  enterMeterReading: true,
  editReadings:     true,
  addDocuments:     true,
  viewReports:      true,
  viewAlerts:       true,
  manageDocuments:  true,
  editUsers:        true,
})

// ─── أسماء الصلاحيات ──────────────────────────────────────────
export const PERMISSION_LABELS = {
  addEquipment:      'إضافة معدات',
  editEquipment:     'تعديل معدات',
  deleteEquipment:   'حذف معدات',
  enterMeterReading: 'إدخال قراءة عداد',
  editReadings:      'تعديل قراءات',
  addDocuments:      'إضافة مستندات',
  viewReports:       'عرض التقارير',
  viewAlerts:        'عرض التنبيهات',
  manageDocuments:   'إدارة المستندات',
  editUsers:         'تعديل بيانات المستخدمين',
}
