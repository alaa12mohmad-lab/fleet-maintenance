// src/components/Layout/AppLayout.jsx
import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'
import { subscribeToCollection } from '../../firebase/firestore'
import { generateAlerts } from '../../firebase/firestore'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [equipment, setEquipment] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [documents, setDocuments] = useState([])

  // Subscribe to data for alert generation
  useEffect(() => {
    const unsubEq = subscribeToCollection('equipments', setEquipment)
    const unsubVh = subscribeToCollection('vehicles', setVehicles)
    const unsubDc = subscribeToCollection('documents', setDocuments)
    return () => { unsubEq(); unsubVh(); unsubDc() }
  }, [])

  useEffect(() => {
    generateAlerts(equipment, vehicles, documents).then(setAlerts)
  }, [equipment, vehicles, documents])

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
          <Outlet context={{ equipment, vehicles, documents, alerts }} />
        </main>
      </div>
    </div>
  )
}
