import { useState, useEffect, useCallback, useRef } from 'react'
import { getMerchants, getDashboardStats } from '../lib/supabase'

export function useMerchants(filters = {}) {
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMerchants(filtersRef.current)
      setMerchants(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, JSON.stringify(filters)])

  return { merchants, loading, error, refetch: load }
}

export function useDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { stats, loading, error, refetch: load }
}
