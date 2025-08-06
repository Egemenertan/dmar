"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useComplaintsWithStats } from "@/hooks/useComplaints"
import { FeedbackMessage } from "@/components/FeedbackMessage"
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  MapPin,
  Store
} from "lucide-react"
import { STORE_CONFIG, type StoreId } from "@/lib/constants"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function FeedbackAnalyticsPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedStore, setSelectedStore] = useState<StoreId | 'all'>('all')
  const { complaints, stats, loading, error } = useComplaintsWithStats()

  // Rating extraction fonksiyonu - en üstte tanımlayalım
  const extractRatingFromMessage = (subject: string, message: string): number | null => {
    const text = subject + ' ' + message
    const subjectMatch = text.match(/(\d+\.?\d*)\s*\/\s*5\s*Yıldız/i)
    if (subjectMatch) return parseFloat(subjectMatch[1])
    
    const avgMatch = text.match(/Ortalama Puan:\s*(\d+\.?\d*)\s*\/\s*5/i)
    if (avgMatch) return parseFloat(avgMatch[1])
    
    const generalMatch = text.match(/GENEL DEĞERLENDİRME:\s*(\d+\.?\d*)\s*\/\s*5/i)
    if (generalMatch) return parseFloat(generalMatch[1])
    
    return null
  }

  // Store bazında filtreleme
  const filteredComplaints = complaints?.filter(complaint => {
    if (selectedStore === 'all') return true
    return complaint.store_id === selectedStore
  }) || []

  // Store bazında istatistikleri hesapla
  const getStoreStats = (storeId: StoreId | 'all') => {
    const storeComplaints = storeId === 'all' ? complaints || [] : 
      (complaints || []).filter(c => c.store_id === storeId)
    
    const totalFeedbacks = storeComplaints.length
    const withRatings = storeComplaints.filter(c => extractRatingFromMessage(c.subject, c.message) !== null)
    const averageRating = withRatings.length > 0 ? 
      withRatings.reduce((sum, c) => sum + (extractRatingFromMessage(c.subject, c.message) || 0), 0) / withRatings.length :
      0
    
    const responded = storeComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length
    const responseRate = totalFeedbacks > 0 ? Math.round((responded / totalFeedbacks) * 100) : 0
    
    const highRating = withRatings.filter(c => (extractRatingFromMessage(c.subject, c.message) || 0) >= 4).length
    const satisfaction = withRatings.length > 0 ? Math.round((highRating / withRatings.length) * 100) : 0

    return {
      totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      responseRate,
      satisfaction
    }
  }

  const currentStats = getStoreStats(selectedStore)



  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-lg font-medium">Veriler yükleniyor...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Feedback verileri ve istatistikler hazırlanıyor
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Veri Yükleme Hatası</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Feedback Analitik</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Müşteri geri bildirimlerini analiz edin ve iyileştirmeler yapın</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-black" />
            <Select value={selectedStore} onValueChange={(value: StoreId | 'all') => setSelectedStore(value)}>
              <SelectTrigger className="w-[140px] sm:w-[180px] border-1 rounded-3xl border-primary text-primary hover:border-primary focus:border-primary focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şubeler</SelectItem>
                {Object.values(STORE_CONFIG).map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    <span className="block sm:hidden">{store.name}</span>
                    <span className="hidden sm:block">{store.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalFeedbacks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {selectedStore === 'all' ? 'Tüm şubelerin' : STORE_CONFIG[selectedStore as StoreId]?.name || ''} toplam geri bildirimi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.averageRating}</div>
            <div className="flex items-center mt-1">
              {getRatingStars(Math.floor(currentStats.averageRating))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yanıt Oranı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{currentStats.responseRate}</div>
            <Progress value={currentStats.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteri Memnuniyeti</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{currentStats.satisfaction}</div>
            <p className="text-xs text-muted-foreground">
              Pozitif değerlendirme oranı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-gray-200 p-0 h-auto rounded-none">
          <TabsTrigger 
            value="overview"
            className="bg-transparent border-0 rounded-none px-3 sm:px-6 py-3 font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Genel Bakış</span>
            <span className="sm:hidden">Genel</span>
          </TabsTrigger>
          <TabsTrigger 
            value="feedbacks"
            className="bg-transparent border-0 rounded-none px-3 sm:px-6 py-3 font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Geri Bildirimler</span>
            <span className="sm:hidden">Feedback</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className="bg-transparent border-0 rounded-none px-3 sm:px-6 py-3 font-medium text-gray-600 hover:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Detaylı Analitik</span>
            <span className="sm:hidden">Analitik</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {selectedStore === 'all' ? (
            /* Tüm Şubeler Karşılaştırması */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Şubeler Karşılaştırması
                  </CardTitle>
                  <CardDescription>Tüm şubelerin performans analizi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {Object.values(STORE_CONFIG).map((store) => {
                      const storeStats = getStoreStats(store.id)
                      return (
                        <div key={store.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <div>
                                <h3 className="font-semibold">{store.fullName}</h3>
                                <p className="text-sm text-gray-600">{store.location}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{storeStats.averageRating}</div>
                              <div className="flex items-center">
                                {getRatingStars(Math.floor(storeStats.averageRating))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">{storeStats.totalFeedbacks}</div>
                              <div className="text-xs text-gray-600">Toplam Feedback</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">%{storeStats.responseRate}</div>
                              <div className="text-xs text-gray-600">Yanıt Oranı</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">%{storeStats.satisfaction}</div>
                              <div className="text-xs text-gray-600">Memnuniyet</div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedStore(store.id)}
                              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 py-1 h-7 flex items-center gap-1"
                            >
                              Detaylı İncele
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Genel Trend Grafik */}
              <Card>
                <CardHeader>
                  <CardTitle>Şubeler Arası Performans Trendi</CardTitle>
                  <CardDescription>Son 30 günlük şube bazında feedback trendi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16" />
                    <span className="ml-2">Şubeler karşılaştırma grafiği burada görüntülenecek</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Tek Şube Detayı */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Store Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {STORE_CONFIG[selectedStore as StoreId]?.fullName}
                  </CardTitle>
                  <CardDescription>
                    {STORE_CONFIG[selectedStore as StoreId]?.location} şubesi detaylı analizi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{currentStats.totalFeedbacks}</div>
                      <div className="text-sm text-blue-600">Toplam Feedback</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{currentStats.averageRating}</div>
                      <div className="text-sm text-green-600">Ortalama Puan</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Yanıt Oranı</span>
                      <span className="font-medium">%{currentStats.responseRate}</span>
                    </div>
                    <Progress value={currentStats.responseRate} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Müşteri Memnuniyeti</span>
                      <span className="font-medium">%{currentStats.satisfaction}</span>
                    </div>
                    <Progress value={currentStats.satisfaction} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Store Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Şube Trend Analizi</CardTitle>
                  <CardDescription>Bu şubenin son 30 günlük trendi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16" />
                    <span className="ml-2">Şube trend grafiği burada görüntülenecek</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedStore === 'all' ? 'Tüm Şubelerden' : STORE_CONFIG[selectedStore as StoreId]?.name} Geri Bildirimler
              </CardTitle>
              <CardDescription>
                {selectedStore === 'all' 
                  ? 'Tüm şubelerden alınan müşteri yorumları ve değerlendirmeleri' 
                  : `${STORE_CONFIG[selectedStore as StoreId]?.location} şubesinden alınan geri bildirimler`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredComplaints && filteredComplaints.length > 0 ? (
                  filteredComplaints.slice(0, 10).map((complaint) => {
                    const rating = extractRatingFromMessage(complaint.subject, complaint.message)
                    return (
                      <div key={complaint.id} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {rating && (
                                <div className="flex items-center">
                                  {getRatingStars(Math.floor(rating))}
                                  <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{new Date(complaint.created_at).toLocaleDateString('tr-TR')}</span>
                              <span>•</span>
                              <span>{complaint.complaint_type}</span>
                              {complaint.store_name && selectedStore === 'all' && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{complaint.store_name}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                         
                        </div>
                        <div>
                          <FeedbackMessage 
                            subject={complaint.subject}
                            message={complaint.message}
                            email={complaint.email}
                            phone={complaint.phone}
                            customerName={complaint.full_name !== 'Anonim Müşteri' ? complaint.full_name : undefined}
                          />
                        </div>

                      </div>
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {selectedStore === 'all' 
                        ? 'Henüz hiçbir şubeden geri bildirim bulunmuyor' 
                        : `${STORE_CONFIG[selectedStore as StoreId]?.name} şubesinden henüz geri bildirim bulunmuyor`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analizi</CardTitle>
                <CardDescription>Yorumların duygu analizi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span>Olumlu</span>
                    </div>
                    <span className="font-medium">%{stats?.sentimentStats.positive || 0}</span>
                  </div>
                  <Progress value={stats?.sentimentStats.positive || 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-yellow-500 rounded" />
                      <span>Nötr</span>
                    </div>
                    <span className="font-medium">%{stats?.sentimentStats.neutral || 0}</span>
                  </div>
                  <Progress value={stats?.sentimentStats.neutral || 0} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      <span>Olumsuz</span>
                    </div>
                    <span className="font-medium">%{stats?.sentimentStats.negative || 0}</span>
                  </div>
                  <Progress value={stats?.sentimentStats.negative || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anahtar Kelimeler</CardTitle>
                <CardDescription>En çok bahsedilen konular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.keywordFrequency && stats.keywordFrequency.length > 0 ? (
                    stats.keywordFrequency.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{item.keyword}</span>
                        <Badge variant="outline">{item.count} kez</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      Henüz anahtar kelime verisi bulunmuyor
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}