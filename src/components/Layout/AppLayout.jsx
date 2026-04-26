// src/components/Layout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { subscribeToCollection } from '../../firebase/firestore'
import { generateAlerts } from '../../firebase/firestore'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alerts, setAlerts]       = useState([])
  const [equipment, setEquipment] = useState([])
  const [vehicles, setVehicles]   = useState([])
  const [documents, setDocuments] = useState([])

  // تتبع حالة التحميل
  const [eqLoaded, setEqLoaded]   = useState(false)
  const [vhLoaded, setVhLoaded]   = useState(false)
  const [dcLoaded, setDcLoaded]   = useState(false)

  useEffect(() => {
    const unsubEq = subscribeToCollection('equipments', data => {
      setEquipment(data)
      setEqLoaded(true)
    })
    const unsubVh = subscribeToCollection('vehicles', data => {
      setVehicles(data)
      setVhLoaded(true)
    })
    const unsubDc = subscribeToCollection('documents', data => {
      setDocuments(data)
      setDcLoaded(true)
    })
    return () => { unsubEq(); unsubVh(); unsubDc() }
  }, [])

  // لا تحسب التنبيهات إلا بعد تحميل كل البيانات
  useEffect(() => {
    if (!eqLoaded || !vhLoaded || !dcLoaded) return
    generateAlerts(equipment, vehicles, documents).then(setAlerts)
  }, [equipment, vehicles, documents, eqLoaded, vhLoaded, dcLoaded])

  const dataReady = eqLoaded && vhLoaded && dcLoaded

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertCount={alerts.filter(a => a.type === 'danger').length}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          alerts={alerts}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {dataReady ? (
            <Outlet context={{ equipment, vehicles, documents, alerts }} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">جاري تحميل البيانات...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
