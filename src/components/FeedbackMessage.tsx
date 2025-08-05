"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, ChevronDown, ChevronRight, Mail, Phone, User } from "lucide-react"

interface FeedbackMessageProps {
  subject: string
  message: string
  email?: string
  phone?: string
  customerName?: string
}

interface ParsedRating {
  category: string
  rating: number
  maxRating: number
}

interface ParsedFeedback {
  overallRating?: number
  detailedRatings: ParsedRating[]
  userMessage?: string
  hasStructuredData: boolean
}

export function FeedbackMessage({ subject, message, email, phone, customerName }: FeedbackMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const parseFeedback = (text: string): ParsedFeedback => {
    const result: ParsedFeedback = {
      detailedRatings: [],
      hasStructuredData: false
    }

    // Genel puanı çıkar
    const overallMatch = text.match(/Ortalama Puan:\s*(\d+\.?\d*)\s*\/\s*(\d+)/i)
    if (overallMatch) {
      result.overallRating = parseFloat(overallMatch[1])
      result.hasStructuredData = true
    }

    // Subject'ten de genel puanı çıkarmaya çalış
    const subjectMatch = subject.match(/(\d+\.?\d*)\s*\/\s*5\s*Yıldız/i)
    if (subjectMatch && !result.overallRating) {
      result.overallRating = parseFloat(subjectMatch[1])
      result.hasStructuredData = true
    }

    // Detaylı puanları çıkar
    const ratingPattern = /•\s*([^:]+):\s*(\d+\.?\d*)\s*\/\s*(\d+)/g
    let match
    
    while ((match = ratingPattern.exec(text)) !== null) {
      result.detailedRatings.push({
        category: match[1].trim(),
        rating: parseFloat(match[2]),
        maxRating: parseInt(match[3])
      })
      result.hasStructuredData = true
    }

    // Kullanıcı mesajını çıkar
    const messageMatch = text.match(/MESAJ:\s*(.+?)(?:\n|$)/i)
    if (messageMatch) {
      result.userMessage = messageMatch[1].trim()
    }

    return result
  }

  const renderStars = (rating: number, maxRating: number = 5) => {
    return Array.from({ length: maxRating }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const getRatingColor = (rating: number, maxRating: number = 5) => {
    const percentage = (rating / maxRating) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const feedback = parseFeedback(message)

  if (!feedback.hasStructuredData) {
    // Yapılandırılmış veri yoksa normal mesajı göster
    return (
      <div className="space-y-2">
        <p className="font-medium text-sm">{subject}</p>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Başlık ve Genel Puan - Her zaman görünür */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -m-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <p className="font-medium text-sm mb-1">{subject}</p>
          {feedback.overallRating && (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getRatingColor(feedback.overallRating)}`}>
                {feedback.overallRating}/5
              </span>
              <div className="flex items-center">
                {renderStars(feedback.overallRating)}
              </div>
            </div>
          )}
        </div>
        
        {/* Chevron Toggle Button */}
        <div className="ml-2 h-8 w-8 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Detaylar - Sadece açıldığında görünür */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3 pl-4 border-l-2 border-gray-200 pt-3">
          {/* Müşteri İletişim Bilgileri */}
          {(customerName && customerName !== 'Anonim Müşteri' || email && email !== 'anonim@dmar.com' || phone) && (
            <Card className="border-0 shadow-none bg-green-50">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">Müşteri İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="space-y-2">
                  {customerName && customerName !== 'Anonim Müşteri' && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{customerName}</span>
                    </div>
                  )}
                  {email && email !== 'anonim@dmar.com' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a 
                        href={`mailto:${email}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {email}
                      </a>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a 
                        href={`tel:${phone}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detaylı Puanlar */}
          {feedback.detailedRatings.length > 0 && (
            <Card className="border-0 shadow-none bg-gray-50">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">Detaylı Puanlar</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <div className="grid grid-cols-1 gap-2">
                  {feedback.detailedRatings.map((rating, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-white">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{rating.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {renderStars(rating.rating, rating.maxRating)}
                        </div>
                        <span className={`text-sm font-medium ${getRatingColor(rating.rating, rating.maxRating)}`}>
                          {rating.rating}/{rating.maxRating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kullanıcı Mesajı */}
          {feedback.userMessage && (
            <Card className="border-0 shadow-none bg-blue-50">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm">Müşteri Yorumu</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <p className="text-sm text-gray-700">{feedback.userMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}