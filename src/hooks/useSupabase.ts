"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Kullanıcı verilerini almak için hook
export function useUsers() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(10)
        
        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, loading, error }
}

// Genel istatistikler için hook
export function useStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    revenue: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Örnek: Kullanıcı sayısını al
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        setStats(prev => ({
          ...prev,
          totalUsers: userCount || 0
        }))
      } catch (error) {
        console.error('İstatistikler alınırken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}

// Real-time değişiklikleri dinlemek için hook
export function useRealtimeData(table: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    // İlk veriyi al
    const fetchInitialData = async () => {
      const { data: initialData } = await supabase
        .from(table)
        .select('*')
      setData(initialData || [])
    }

    fetchInitialData()

    // Real-time dinleyiciyi kur
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        (payload) => {
          console.log('Real-time değişiklik:', payload)
          // Veriyi güncelle
          fetchInitialData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table])

  return data
}