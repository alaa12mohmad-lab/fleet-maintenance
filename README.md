# 🚛 Fleet & Equipment Maintenance Management System
## نظام إدارة ومتابعة صيانة المعدات والسيارات

---

## 📋 محتوى المشروع

| الملف/المجلد | الوصف |
|---|---|
| `src/firebase/config.js` | إعدادات Firebase |
| `src/firebase/auth.js` | منطق المصادقة والصلاحيات |
| `src/firebase/firestore.js` | عمليات قاعدة البيانات |
| `src/context/AuthContext.jsx` | إدارة حالة المستخدم |
| `src/pages/` | جميع الصفحات |
| `src/components/` | جميع المكونات |
| `src/utils/` | دوال مساعدة |
| `firestore.rules` | قواعد أمان Firestore |
| `storage.rules` | قواعد أمان Storage |

---

## 🚀 خطوات التثبيت والتشغيل

### الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل الخدمات التالية:
   - **Authentication** → Email/Password
   - **Firestore Database** → Production mode
   - **Storage**
   - **Hosting**

### الخطوة 2: إنشاء حساب المدير الرئيسي

في Firebase Console → Authentication → Add User:
```
Email: >>>>>>>>>
Password: [كلمة مرور قوية]
```

### الخطوة 3: إعداد Firestore

في Firebase Console → Firestore → إنشاء document يدوياً:

**Collection: `users` → Document ID: [uid المدير]**
```json
{
  "uid": "UID_من_Firebase_Auth",
  "email": "your email",
  "displayName": "your nam",
  "role": "admin",
  "isActive": true,
  "permissions": {
    "addEquipment": true,
    "editEquipment": true,
    "deleteEquipment": true,
    "enterMeterReading": true,
    "editReadings": true,
    "addDocuments": true,
    "viewReports": true,
    "viewAlerts": true,
    "manageDocuments": true,
    "editUsers": true
  },
  "createdAt": "timestamp"
}
```

### الخطوة 4: ضبط إعدادات Firebase في الكود

افتح `src/firebase/config.js` وضع بيانات مشروعك:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

**أين تجد هذه البيانات؟**
- Firebase Console → Project Settings → Your apps → Web app → SDK setup

### الخطوة 5: تثبيت المتطلبات وتشغيل المشروع

```bash
# تثبيت المتطلبات
npm install

# تشغيل في وضع التطوير
npm run dev

# الموقع سيعمل على: http://localhost:5173
```

### الخطوة 6: رفع قواعد الأمان

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# ربط المشروع
firebase use your-project-id

# رفع قواعد الأمان فقط
firebase deploy --only firestore:rules,storage
```

### الخطوة 7: النشر على Firebase Hosting

```bash
# بناء المشروع
npm run build

# نشر على Firebase Hosting
firebase deploy

# أو بناء ونشر في أمر واحد
npm run deploy
```

---

## 👥 إدارة المستخدمين

### آلية الدعوات (Invite-Only System)

```
المدير يضيف البريد الإلكتروني
         ↓
تُنشأ دعوة في Firestore (invitations)
         ↓
يفتح المستخدم الموقع → تبويب "تفعيل دعوة"
         ↓
يدخل بريده + كلمة مرور جديدة
         ↓
يصله بريد تحقق → يضغط الرابط
         ↓
يسجل الدخول بشكل طبيعي
```

### أنواع الصلاحيات

| الصلاحية | الوصف |
|---|---|
| `addEquipment` | إضافة معدات/سيارات |
| `editEquipment` | تعديل بيانات المعدات |
| `deleteEquipment` | حذف المعدات |
| `enterMeterReading` | إدخال قراءة عداد |
| `editReadings` | تعديل القراءات |
| `addDocuments` | إضافة مستندات |
| `viewReports` | عرض التقارير |
| `viewAlerts` | عرض التنبيهات |
| `manageDocuments` | إدارة المستندات |
| `editUsers` | تعديل بيانات المستخدمين |

---

## 📊 هيكل قاعدة البيانات (Firestore Collections)

```
firestore/
├── users/
│   └── {uid}/
│       ├── email, displayName, role
│       ├── permissions: { addEquipment, editEquipment, ... }
│       └── isActive, createdAt, lastLogin
│
├── invitations/
│   └── {invId}/
│       ├── email, displayName, role
│       ├── permissions: { ... }
│       ├── status: pending | accepted | rejected
│       └── invitedBy, createdAt
│
├── equipments/
│   └── {equipId}/
│       ├── name, code, plateNumber, driver
│       ├── meterType: km | hours
│       ├── currentReading, lastReadingDate
│       ├── lastOilChangeReading, lastOilChangeDate
│       ├── oilChangeInterval
│       └── notes, createdAt, updatedAt
│
├── vehicles/
│   └── {vehicleId}/    ← نفس هيكل equipments
│
├── meter_readings/
│   └── {readingId}/
│       ├── equipmentId, equipmentType
│       ├── reading, notes
│       └── recordedBy, createdAt
│
├── oil_changes/
│   └── {changeId}/
│       ├── equipmentId, equipmentType
│       ├── reading, date, notes
│       └── recordedBy, createdAt
│
├── maintenance_logs/
│   └── {logId}/
│       ├── equipmentId, equipmentName, equipmentType
│       ├── maintenanceType, description
│       ├── date, meterReading
│       ├── cost, workshop
│       └── notes, recordedBy, createdAt
│
└── documents/
    └── {docId}/
        ├── name, docType, category
        ├── linkedId, linkedName, linkedType
        ├── issueDate, expiryDate
        ├── fileUrl, fileName
        └── notes, uploadedBy, createdAt
```

---

## 🔔 نظام التنبيهات

التنبيهات تُحسب تلقائياً عند كل تحميل للصفحة:

| الحالة | المعيار | نوع التنبيه |
|---|---|---|
| تغيير زيت متجاوز | القراءة الحالية > (آخر تغيير + الفترة) | 🔴 خطر |
| تغيير زيت قريب | المتبقي ≤ 500 وحدة | 🟡 تحذير |
| وثيقة منتهية | تاريخ الانتهاء < اليوم | 🔴 خطر |
| وثيقة تنتهي قريباً | الانتهاء خلال ≤ 30 يوم | 🟡 تحذير |

---

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---|---|---|
| React | 18 | واجهة المستخدم |
| React Router | 6 | التنقل بين الصفحات |
| Firebase | 10 | Backend كامل |
| Tailwind CSS | 3 | التصميم |
| Recharts | 2 | الرسوم البيانية |
| React Hot Toast | 2 | الإشعارات |
| XLSX | 0.18 | تصدير Excel |
| Lucide React | - | الأيقونات |
| date-fns | 3 | معالجة التواريخ |

---

## 📁 هيكل الملفات الكامل

```
fleet-maintenance/
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   ├── config.js          ← ضع بيانات Firebase هنا
│   │   ├── auth.js            ← منطق المصادقة
│   │   └── firestore.js       ← عمليات DB
│   ├── context/
│   │   └── AuthContext.jsx    ← إدارة المستخدم
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppLayout.jsx  ← الهيكل الرئيسي
│   │   │   ├── Sidebar.jsx    ← القائمة الجانبية
│   │   │   └── Header.jsx     ← الشريط العلوي
│   │   ├── Common/
│   │   │   └── index.jsx      ← مكونات مشتركة
│   │   ├── Equipment/
│   │   │   ├── EquipmentCard.jsx
│   │   │   ├── EquipmentForm.jsx
│   │   │   └── MeterReadingForm.jsx
│   │   ├── Maintenance/
│   │   │   └── MaintenanceForm.jsx
│   │   ├── Documents/
│   │   │   └── DocumentForm.jsx
│   │   └── Admin/
│   │       └── AdminForms.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Equipment.jsx      ← يُستخدم لمعدات وسيارات
│   │   ├── Maintenance.jsx
│   │   ├── OilChanges.jsx
│   │   ├── Documents.jsx
│   │   ├── Alerts.jsx
│   │   ├── Reports.jsx
│   │   └── admin/
│   │       ├── Users.jsx
│   │       └── Invitations.jsx
│   ├── utils/
│   │   ├── calculations.js    ← حسابات الزيت والمستندات
│   │   └── exportUtils.js     ← تصدير Excel/PDF
│   ├── App.jsx                ← الـ Routing الرئيسي
│   ├── main.jsx
│   └── index.css
├── firestore.rules            ← قواعد أمان Firestore
├── storage.rules              ← قواعد أمان Storage
├── firebase.json              ← إعدادات النشر
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## ⚠️ ملاحظات مهمة

1. **لا تشارك ملف `config.js`** في مستودعات عامة — استخدم `.env` للإنتاج
2. **قواعد Firestore** مهمة جداً — ارفعها قبل الاستخدام الفعلي
3. **حساب المدير** (`alaa12mohmad@gmail.com`) يجب إنشاؤه يدوياً في Firebase Auth
4. **document في users** للمدير يجب إنشاؤه يدوياً أو عبر script

---

## 🔐 حماية متغيرات البيئة (للإنتاج)

أنشئ ملف `.env` في جذر المشروع:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

ثم عدّل `config.js`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
}
```

أضف `.env` إلى `.gitignore`.

---

## 📞 الدعم الفني

في حالة أي مشكلة:
1. تحقق من Console في المتصفح (F12)
2. تحقق من Firebase Console → Logs
3. تأكد من رفع Firestore Rules بشكل صحيح
