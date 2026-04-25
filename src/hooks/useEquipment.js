// src/hooks/useEquipment.js
import { useState, useEffect } from 'react'
import { subscribeToCollection } from '../firebase/firestore'

/**
 * Hook to subscribe to equipment or vehicles in real-time
 * @param {'equipments'|'vehicles'} collection
 */
export function useEquipment(collection = 'equipments') {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeToCollection(
      collection,
      (data) => { setItems(data); setLoading(false) },
      []
    )
    return unsub
  }, [collection])

  return { items, loading, error }
}

/**
 * Hook that returns both equipment and vehicles together
 */
export function useAllFleet() {
  const { items: equipment, loading: eqLoading } = useEquipment('equipments')
  const { items: vehicles,  loading: vhLoading  } = useEquipment('vehicles')

  return {
    equipment,
    vehicles,
    allItems: [...equipment, ...vehicles],
    loading: eqLoading || vhLoading,
  }
}
