// src/hooks/useAlerts.js
import { useState, useEffect } from 'react'
import { generateAlerts } from '../firebase/firestore'

/**
 * Derives alerts from live equipment/vehicle/document data.
 * Call with the three arrays from AppLayout context.
 */
export function useAlerts(equipment = [], vehicles = [], documents = []) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    generateAlerts(equipment, vehicles, documents).then(setAlerts)
  }, [equipment, vehicles, documents])

  const danger  = alerts.filter(a => a.type === 'danger')
  const warning = alerts.filter(a => a.type === 'warning')

  return { alerts, danger, warning, total: alerts.length }
}
