/**
 * scripts/setup-admin.mjs
 * ════════════════════════════════════════════════════════════════
 * Run ONCE after creating the admin account in Firebase Auth.
 * This script creates the admin user document in Firestore.
 *
 * Usage:
 *   1. npm install -g firebase-admin   (or locally: npm i firebase-admin)
 *   2. Download your service account key from:
 *      Firebase Console → Project Settings → Service Accounts →
 *      Generate new private key  → save as scripts/serviceAccountKey.json
 *   3. node scripts/setup-admin.mjs
 * ════════════════════════════════════════════════════════════════
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const admin = require('firebase-admin')

// ── Config ────────────────────────────────────────────────────
const ADMIN_EMAIL  = 'alaa12mohmad@gmail.com'
const ADMIN_NAME   = 'علاء - المدير'
const SERVICE_KEY  = new URL('./serviceAccountKey.json', import.meta.url)

// ── Init ──────────────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync(SERVICE_KEY, 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const auth = admin.auth()
const db   = admin.firestore()

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Looking up admin user by email:', ADMIN_EMAIL)

  let uid
  try {
    const userRecord = await auth.getUserByEmail(ADMIN_EMAIL)
    uid = userRecord.uid
    console.log('✅ Found Firebase Auth user:', uid)
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error('❌ User not found in Firebase Auth.')
      console.error('   → Create the account first in Firebase Console → Authentication')
      process.exit(1)
    }
    throw err
  }

  const adminPermissions = {
    addEquipment:    true,
    editEquipment:   true,
    deleteEquipment: true,
    enterMeterReading: true,
    editReadings:    true,
    addDocuments:    true,
    viewReports:     true,
    viewAlerts:      true,
    manageDocuments: true,
    editUsers:       true,
  }

  const adminDoc = {
    uid,
    email:        ADMIN_EMAIL,
    displayName:  ADMIN_NAME,
    role:         'admin',
    isActive:     true,
    emailVerified: true,
    permissions:  adminPermissions,
    createdAt:    admin.firestore.FieldValue.serverTimestamp(),
    lastLogin:    null,
  }

  await db.collection('users').doc(uid).set(adminDoc, { merge: true })
  console.log('✅ Admin document created/updated in Firestore → users/' + uid)
  console.log('')
  console.log('🎉 Done! You can now log in with:')
  console.log('   Email:', ADMIN_EMAIL)
  console.log('   Go to your app and sign in.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
