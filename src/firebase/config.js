// src/firebase/config.js
// ════════════════════════════════════════════════════════════════
// طريقتان لضبط الإعدادات:
//
// الطريقة 1 (للإنتاج - الأفضل):
//   أنشئ ملف .env من .env.example وضع قيمك الحقيقية فيه
//
// الطريقة 2 (للتطوير السريع):
//   ضع قيمك مباشرة في firebaseConfig أدناه
// ════════════════════════════════════════════════════════════════
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBsWk1DX0-hUmh1vTOePXVx1DNB6IdF1Eg",
  authDomain: "fleet-maintenance-6f3c2.firebaseapp.com",
  projectId: "fleet-maintenance-6f3c2",
  storageBucket: "fleet-maintenance-6f3c2.firebasestorage.app",
  messagingSenderId: "441637286306",
  appId: "1:441637286306:web:8f66ef7928b5fce3d742fb"             import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
