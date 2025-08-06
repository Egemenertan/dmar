'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { BRAND_ASSETS, STORE_CONFIG, type StoreId } from "@/lib/constants"
import { CheckCircle, Send, AlertCircle, Star, ArrowLeft, ArrowRight, Mail, Phone, MapPin } from "lucide-react"
import Image from "next/image"

interface FeedbackForm {
  email: string
  phone: string
  // Store bilgisi
  store_id: string
  store_name: string
  // Adım 1: Genel Değerlendirme
  overall_rating: number
  // Adım 2: Market Değerlendirmesi
  product_quality: number
  price_satisfaction: number
  staff_friendliness: number
  cleanliness_rating: number
  shopping_experience: number
  // Adım 3: Mesaj
  message: string
}

interface RatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  label: string
  required?: boolean
}

// Yıldız Rating Komponenti
function StarRating({ rating, onRatingChange, label, required = false }: RatingProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-8 w-8 ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : 'Değerlendirin'}
        </span>
      </div>
    </div>
  )
}

function FeedbackContent() {
  const searchParams = useSearchParams()
  const storeParam = searchParams.get('store') as StoreId
  
  // Store bilgisini belirle
  const currentStore = storeParam && STORE_CONFIG[storeParam] 
    ? STORE_CONFIG[storeParam] 
    : STORE_CONFIG.courtyard // Default olarak courtyard

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FeedbackForm>({
    email: '',
    phone: '',
    store_id: currentStore.id,
    store_name: currentStore.name,
    overall_rating: 0,
    product_quality: 0,
    price_satisfaction: 0,
    staff_friendliness: 0,
    cleanliness_rating: 0,
    shopping_experience: 0,
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  
  // Spam koruması için
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0)
  const [submitCount, setSubmitCount] = useState<number>(0)
  const SUBMIT_COOLDOWN = 30000 // 30 saniye cooldown
  const MAX_SUBMISSIONS_PER_DAY = 2 // 24 saatte maksimum 2 gönderim

  // LocalStorage'dan gönderim geçmişini yükle (store bazında)
  useEffect(() => {
    const storageKey = `dmar_feedback_submissions_${currentStore.id}`
    const savedSubmissions = localStorage.getItem(storageKey)
    if (savedSubmissions) {
      const submissions = JSON.parse(savedSubmissions)
      const now = Date.now()
      // Son 24 saat içindeki gönderileri filtrele
      const recentSubmissions = submissions.filter((time: number) => now - time < 86400000) // 24 saat = 86400000ms
      setSubmitCount(recentSubmissions.length)
      
      // En son gönderim zamanını bul
      if (recentSubmissions.length > 0) {
        setLastSubmitTime(Math.max(...recentSubmissions))
      }
    }
  }, [currentStore.id])

  const handleInputChange = (field: keyof FeedbackForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Spam kontrolü
  const canSubmit = () => {
    const now = Date.now()
    const timeSinceLastSubmit = now - lastSubmitTime
    
    // 30 saniye cooldown kontrolü
    if (timeSinceLastSubmit < SUBMIT_COOLDOWN) {
      return {
        canSubmit: false,
        reason: `Lütfen ${Math.ceil((SUBMIT_COOLDOWN - timeSinceLastSubmit) / 1000)} saniye bekleyin.`
      }
    }
    
    // Günlük limit kontrolü
    if (submitCount >= MAX_SUBMISSIONS_PER_DAY) {
      return {
        canSubmit: false,
        reason: '24 saat içinde maksimum 2 geri bildirim gönderebilirsiniz. Lütfen yarın tekrar deneyin.'
      }
    }
    
    return { canSubmit: true, reason: '' }
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedFromStep1 = () => {
    return form.product_quality > 0 && 
           form.price_satisfaction > 0 && 
           form.staff_friendliness > 0 && 
           form.cleanliness_rating > 0 && 
           form.shopping_experience > 0
  }

  const handleSubmit = async () => {
    // Spam kontrolü
    const submitCheck = canSubmit()
    if (!submitCheck.canSubmit) {
      setSubmitStatus({
        type: 'error',
        message: submitCheck.reason
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Email validasyonu (eğer girilmişse)
      if (form.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          throw new Error('Lütfen geçerli bir email adresi girin.')
        }
      }

      // Rating ortalamalarını hesapla
      const averageRating = (
        form.product_quality + 
        form.price_satisfaction + 
        form.staff_friendliness + 
        form.cleanliness_rating + 
        form.shopping_experience
      ) / 5

      // Feedback tipini belirle (ortalama rating'e göre)
      let feedbackType: 'complaint' | 'suggestion' | 'request' = 'suggestion'
      if (averageRating <= 2) {
        feedbackType = 'complaint'
      } else if (averageRating >= 4) {
        feedbackType = 'suggestion'
      } else {
        feedbackType = 'request'
      }

      // Konu oluştur
      const subject = `${currentStore.name} - Market Değerlendirmesi - ${averageRating.toFixed(1)}/5 Yıldız`

      // Detaylı mesaj oluştur
      const detailedMessage = `
MARKET DEĞERLENDİRMESİ:
📍 Şube: ${currentStore.fullName} (${currentStore.location})

DETAYLI PUANLAR:
• Ürün Kalitesi: ${form.product_quality}/5 ⭐
• Fiyat Memnuniyeti: ${form.price_satisfaction}/5 ⭐
• Personel Dostluğu: ${form.staff_friendliness}/5 ⭐
• Temizlik: ${form.cleanliness_rating}/5 ⭐
• Alışveriş Deneyimi: ${form.shopping_experience}/5 ⭐

Ortalama Puan: ${averageRating.toFixed(1)}/5 ⭐
${form.message ? `\nMESAJ:\n${form.message}` : ''}
      `.trim()

      // Supabase'e kaydet
      const { error } = await supabase
        .from('complaints')
        .insert([
          {
            full_name: 'Anonim Müşteri', // Ad soyad istenmiyor
            email: form.email || 'anonim@dmar.com', // Email yoksa anonim
            phone: form.phone || null,
            complaint_type: feedbackType,
            subject: subject,
            message: detailedMessage,
            status: 'pending',
            priority: averageRating <= 2 ? 'high' : 'medium',
            store_id: form.store_id,
            store_name: form.store_name,
            store_location: currentStore.location
          }
        ])

      if (error) {
        console.error('Supabase error:', error)
        throw new Error('Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.')
      }

      // Başarılı gönderim - LocalStorage'a kaydet (store bazında)
      const now = Date.now()
      const storageKey = `dmar_feedback_submissions_${currentStore.id}`
      const savedSubmissions = localStorage.getItem(storageKey)
      let submissions = savedSubmissions ? JSON.parse(savedSubmissions) : []
      
      // Yeni gönderimi ekle
      submissions.push(now)
      
      // Son 24 saat içindeki gönderileri filtrele ve kaydet
      submissions = submissions.filter((time: number) => now - time < 86400000)
      localStorage.setItem(storageKey, JSON.stringify(submissions))
      
      // State'leri güncelle
      setLastSubmitTime(now)
      setSubmitCount(submissions.length)

      setSubmitStatus({
        type: 'success',
        message: 'Geri bildiriminiz başarıyla gönderildi! Değerli görüşleriniz için teşekkür ederiz.'
      })

      // Formu temizle
      setForm({
        email: '',
        phone: '',
        store_id: currentStore.id,
        store_name: currentStore.name,
        overall_rating: 0,
        product_quality: 0,
        price_satisfaction: 0,
        staff_friendliness: 0,
        cleanliness_rating: 0,
        shopping_experience: 0,
        message: ''
      })

      // İlk adıma dön
      setCurrentStep(1)

    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen tekrar deneyin.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Market Hizmetleri Değerlendirmesi'
      case 2: return 'Mesaj ve İletişim'
      default: return ''
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Market hizmetlerimizi detaylı olarak değerlendirin'
      case 2: return 'Mesajınız ve iletişim bilgileriniz (opsiyonel)'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4  overflow-hidden flex items-center justify-center">
            <Image
              src={BRAND_ASSETS.logo}
              alt="DMAR Market Logo"
              width={74}
              height={74}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Müşteri Geri Bildirimi
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-medium text-gray-700">{currentStore.fullName}</span>
          </div>
          <p className="text-lg text-gray-600">
            {currentStore.location} şubemizin hizmetlerini değerlendirin
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Adım {currentStep} / 2</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 2) * 100)}% Tamamlandı</span>
          </div>
          <div className="w-full bg-gray-200 rounded-2xl h-2">
            <div 
              className="bg-primary h-2 rounded-2xl transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {submitStatus.type && (
          <Alert 
            className={`mb-6 rounded-2xl ${
              submitStatus.type === 'success' 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {submitStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="ml-2">
              {submitStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-0 rounded-2xl">
          <CardHeader className="bg-white rounded-t-2xl border-b">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Adım 1: Market Hizmetleri Değerlendirmesi */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-6">
                  <StarRating
                    rating={form.product_quality}
                    onRatingChange={(rating) => handleInputChange('product_quality', rating)}
                    label="Ürün kalitesi nasıl?"
                    required
                  />
                  
                  <StarRating
                    rating={form.price_satisfaction}
                    onRatingChange={(rating) => handleInputChange('price_satisfaction', rating)}
                    label="Fiyatlardan memnuniyet düzeyiniz?"
                    required
                  />
                  
                  <StarRating
                    rating={form.staff_friendliness}
                    onRatingChange={(rating) => handleInputChange('staff_friendliness', rating)}
                    label="Personelin dostluğu ve yardımseverliği?"
                    required
                  />
                  
                  <StarRating
                    rating={form.cleanliness_rating}
                    onRatingChange={(rating) => handleInputChange('cleanliness_rating', rating)}
                    label="Market temizliği ve düzeni?"
                    required
                  />
                  
                  <StarRating
                    rating={form.shopping_experience}
                    onRatingChange={(rating) => handleInputChange('shopping_experience', rating)}
                    label="Genel alışveriş deneyimi?"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedFromStep1()}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-6 py-2 flex items-center gap-2"
                  >
                    İleri
                    <ArrowRight className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            )}

            {/* Adım 2: Mesaj ve İletişim */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-900">
                    Görüş, öneri veya şikayetiniz (Opsiyonel)
                  </Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('message', e.target.value)}
                    placeholder="Deneyiminizi, önerilerinizi veya şikayetlerinizi detaylı olarak yazabilirsiniz..."
                    rows={5}
                    className="rounded-2xl border-gray-200 focus:border-gray-900 focus:ring-gray-900 resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    İsteğe bağlı olarak ek mesajınızı yazabilirsiniz.
                  </p>
                </div>

                {/* Spam uyarısı */}
                {!canSubmit().canSubmit && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        {canSubmit().reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* İletişim Bilgileri */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    İletişim Bilgileri (Opsiyonel)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                        E-posta Adresi
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="ornek@email.com"
                          className="pl-10 rounded-2xl border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Size dönüş yapmamız için e-posta adresinizi paylaşabilirsiniz.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                        Telefon Numarası
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="0555 123 45 67"
                          className="pl-10 rounded-2xl border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Acil durumlar için telefon numaranızı paylaşabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>



                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="rounded-2xl px-6 py-2 flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canSubmit().canSubmit}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Gönder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Geri bildiriminiz gizli tutulacak ve değerlendirilerek size dönüş yapılacaktır.
            <br />
            {currentStore.fullName} - Müşteri memnuniyeti önceliğimizdir.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
      <FeedbackContent />
    </Suspense>
  )
}