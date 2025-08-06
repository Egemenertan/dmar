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

// Stats hesaplama fonksiyonunu ayrı bir yardımcı fonksiyon yap
function calculateStatsFromData(complaints: Complaint[], setStats: (stats: FeedbackStats) => void) {
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

  complaints.forEach((complaint) => {
    // Rating çıkar
    const rating = extractRatingFromMessage(complaint.subject + ' ' + complaint.message)
    if (rating) {
      ratings.push(rating)
      const roundedRating = Math.floor(rating)
      ratingDistribution[roundedRating] = (ratingDistribution[roundedRating] || 0) + 1
      
      // Sentiment analizi
      if (rating >= 4) positiveCount++
      else if (rating <= 2) negativeCount++
      else neutralCount++
    }

    // Çözülme durumu
    if (complaint.status === 'resolved' || complaint.status === 'closed') {
      resolvedCount++
    }

    // Kategori analizi
    const category = complaint.complaint_type
    if (!categoryMap[category]) {
      categoryMap[category] = { positive: 0, negative: 0, total: 0 }
    }
    categoryMap[category].total++
    if (rating && rating >= 4) categoryMap[category].positive++
    if (rating && rating <= 2) categoryMap[category].negative++

    // Anahtar kelimeler
    const keywords = extractKeywords(complaint.message)
    keywords.forEach(keyword => {
      keywordMap[keyword] = (keywordMap[keyword] || 0) + 1
    })
  })

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
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
}

// Birleştirilmiş hook - hem complaints hem de stats'ı tek seferde döner
export function useComplaintsWithStats() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        // Timeout ekleyelim - 10 saniye
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('İstek zaman aşımına uğradı')), 10000)
        })
        
        const dataPromise = supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false })
        
        const result = await Promise.race([dataPromise, timeoutPromise])
        const { data, error } = result as { data: Complaint[] | null; error: Error | null }
        
        if (error) throw error
        
        const complaintsData = data || []
        setComplaints(complaintsData)
        
        // Stats'ı da aynı veri ile hesapla
        calculateStatsFromData(complaintsData, setStats)
        
      } catch (err) {
        console.error('Complaints fetch error:', err)
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { complaints, stats, loading, error }
}

// Geriye uyumluluk için eski hook'u koruyalım
export function useComplaints() {
  const { complaints, loading, error } = useComplaintsWithStats()
  return { complaints, loading, error }
}

// Geriye uyumluluk için - artık useComplaintsWithStats'ı kullanıyor
export function useFeedbackStats() {
  const { stats, loading, error } = useComplaintsWithStats()
  return { stats, loading, error }
}