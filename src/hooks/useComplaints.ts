"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Complaint {
  id: string
  full_name: string
  email: string
  phone?: string
  complaint_type: 'complaint' | 'request' | 'suggestion'
  subject: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
  response_message?: string
  // Store bilgileri
  store_id?: string
  store_name?: string
  store_location?: string
}

export interface FeedbackStats {
  totalFeedbacks: number
  averageRating: number
  responseRate: number
  satisfaction: number
  ratingDistribution: { [key: number]: number }
  categoryStats: Array<{
    name: string
    positive: number
    negative: number
    total: number
  }>
  sentimentStats: {
    positive: number
    neutral: number
    negative: number
  }
  keywordFrequency: Array<{
    keyword: string
    count: number
  }>
}

// Rating'i message'dan çıkarmak için helper function
function extractRatingFromMessage(message: string): number | null {
  // "Market Değerlendirmesi - 4.6/5 Yıldız" formatı için
  const subjectMatch = message.match(/(\d+\.?\d*)\s*\/\s*5\s*Yıldız/i)
  if (subjectMatch) {
    return parseFloat(subjectMatch[1])
  }

  // "Ortalama Puan: 4.6/5" formatı için
  const avgMatch = message.match(/Ortalama Puan:\s*(\d+\.?\d*)\s*\/\s*5/i)
  if (avgMatch) {
    return parseFloat(avgMatch[1])
  }

  // "GENEL DEĞERLENDİRME: 4/5" formatı için
  const generalMatch = message.match(/GENEL DEĞERLENDİRME:\s*(\d+\.?\d*)\s*\/\s*5/i)
  if (generalMatch) {
    return parseFloat(generalMatch[1])
  }

  return null
}

// Kategori çıkarma
function extractCategoryFromSubject(subject: string): string {
  if (subject.toLowerCase().includes('değerlendirme')) return 'Genel Değerlendirme'
  if (subject.toLowerCase().includes('ürün')) return 'Ürün Kalitesi'
  if (subject.toLowerCase().includes('teslimat')) return 'Teslimat'
  if (subject.toLowerCase().includes('hizmet')) return 'Müşteri Hizmetleri'
  if (subject.toLowerCase().includes('fiyat')) return 'Fiyat'
  return 'Diğer'
}

// Anahtar kelime çıkarma
function extractKeywords(message: string): string[] {
  const keywords = []
  const text = message.toLowerCase()
  
  // Yaygın pozitif kelimeler
  const positiveWords = ['kaliteli', 'hızlı', 'güzel', 'iyi', 'memnun', 'uygun', 'temiz', 'dostça']
  // Yaygın negatif kelimeler
  const negativeWords = ['kötü', 'yavaş', 'pahalı', 'kirli', 'zayıf', 'eksik', 'bozuk']
  
  positiveWords.forEach(word => {
    if (text.includes(word)) keywords.push(word)
  })
  
  negativeWords.forEach(word => {
    if (text.includes(word)) keywords.push(word)
  })
  
  // Teslimat ile ilgili
  if (text.includes('teslimat')) keywords.push('teslimat')
  if (text.includes('hızlı teslimat')) keywords.push('hızlı teslimat')
  if (text.includes('uygun fiyat')) keywords.push('uygun fiyat')
  if (text.includes('müşteri hizmetleri')) keywords.push('müşteri hizmetleri')
  if (text.includes('paketleme')) keywords.push('paketleme')
  
  return keywords
}

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComplaints() {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setComplaints(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  return { complaints, loading, error }
}

export function useFeedbackStats() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function calculateStats() {
      try {
        const { data: complaints, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        if (!complaints || complaints.length === 0) {
          setStats({
            totalFeedbacks: 0,
            averageRating: 0,
            responseRate: 0,
            satisfaction: 0,
            ratingDistribution: {},
            categoryStats: [],
            sentimentStats: { positive: 0, neutral: 0, negative: 0 },
            keywordFrequency: []
          })
          return
        }

        // Rating'leri çıkar
        const ratings: number[] = []
        const ratingDistribution: { [key: number]: number } = {}
        const categoryMap: { [key: string]: { positive: number, negative: number, total: number } } = {}
        const keywordMap: { [key: string]: number } = {}
        
        let resolvedCount = 0
        let positiveCount = 0
        let negativeCount = 0
        let neutralCount = 0

        complaints.forEach((complaint: Record<string, unknown>) => {
          const rating = extractRatingFromMessage(String(complaint.subject) + ' ' + String(complaint.message))
          
          if (rating !== null) {
            ratings.push(rating)
            ratingDistribution[Math.floor(rating)] = (ratingDistribution[Math.floor(rating)] || 0) + 1
          }

          // Kategori istatistikleri
          const category = extractCategoryFromSubject(String(complaint.subject))
          if (!categoryMap[category]) {
            categoryMap[category] = { positive: 0, negative: 0, total: 0 }
          }
          categoryMap[category].total++
          
          // Sentiment analizi (basit)
          if (rating !== null) {
            if (rating >= 4) {
              categoryMap[category].positive++
              positiveCount++
            } else if (rating <= 2) {
              categoryMap[category].negative++
              negativeCount++
            } else {
              neutralCount++
            }
          }

          // Anahtar kelimeler
          const keywords = extractKeywords(String(complaint.message))
          keywords.forEach(keyword => {
            keywordMap[keyword] = (keywordMap[keyword] || 0) + 1
          })

          // Çözülmüş sayısı
          if (complaint.status === 'resolved' || complaint.status === 'closed') {
            resolvedCount++
          }
        })

        // İstatistikleri hesapla
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        const responseRate = complaints.length > 0 ? Math.round((resolvedCount / complaints.length) * 100) : 0
        const satisfaction = ratings.length > 0 ? Math.round((positiveCount / ratings.length) * 100) : 0

        // Kategori istatistiklerini düzenle
        const categoryStats = Object.entries(categoryMap).map(([name, stats]) => ({
          name,
          positive: stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0,
          negative: stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0,
          total: stats.total
        }))

        // Anahtar kelime sıklığı
        const keywordFrequency = Object.entries(keywordMap)
          .map(([keyword, count]) => ({ keyword, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Sentiment istatistikleri
        const totalSentiment = positiveCount + neutralCount + negativeCount
        const sentimentStats = {
          positive: totalSentiment > 0 ? Math.round((positiveCount / totalSentiment) * 100) : 0,
          neutral: totalSentiment > 0 ? Math.round((neutralCount / totalSentiment) * 100) : 0,
          negative: totalSentiment > 0 ? Math.round((negativeCount / totalSentiment) * 100) : 0
        }

        setStats({
          totalFeedbacks: complaints.length,
          averageRating: Math.round(averageRating * 10) / 10,
          responseRate,
          satisfaction,
          ratingDistribution,
          categoryStats,
          sentimentStats,
          keywordFrequency
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'İstatistik hesaplama hatası')
      } finally {
        setLoading(false)
      }
    }

    calculateStats()
  }, [])

  return { stats, loading, error }
}