'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STORE_CONFIG, type StoreId } from "@/lib/constants"
import { QrCode, Download, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QRCodeGeneratorProps {
  baseUrl?: string
}

export function QRCodeGenerator({ baseUrl = window.location.origin }: QRCodeGeneratorProps) {
  const [selectedStore, setSelectedStore] = useState<StoreId>('courtyard')
  const [copied, setCopied] = useState(false)

  const generateFeedbackUrl = (storeId: StoreId) => {
    return `${baseUrl}/feedback?store=${storeId}`
  }

  const currentStore = STORE_CONFIG[selectedStore]
  const feedbackUrl = generateFeedbackUrl(selectedStore)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(feedbackUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('URL kopyalanamadı:', err)
    }
  }

  const downloadQRCode = () => {
    // QR kod oluşturma servisi kullanarak
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(feedbackUrl)}&format=png&bgcolor=FFFFFF&color=000000&qzone=2&margin=10`
    
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `qr_${selectedStore}_feedback.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            QR Kod Oluşturucu
          </CardTitle>
          <CardDescription>
            Her şube için özel geri bildirim QR kodları oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Şube Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Şube Seçin</label>
            <Select value={selectedStore} onValueChange={(value: StoreId) => setSelectedStore(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(STORE_CONFIG).map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.fullName} - {store.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seçilen Şube Bilgisi */}
          <Alert>
            <AlertDescription>
              <strong>Seçilen Şube:</strong> {currentStore.fullName} ({currentStore.location})
            </AlertDescription>
          </Alert>

          {/* URL Önizleme */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Geri Bildirim URL&apos;si</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg text-sm font-mono break-all">
                {feedbackUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* QR Kod Görüntüsü */}
          <div className="space-y-4">
            <label className="text-sm font-medium">QR Kod Önizleme</label>
            <div className="flex flex-col items-center space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(feedbackUrl)}&format=png&bgcolor=FFFFFF&color=000000&qzone=2&margin=10`}
                  alt={`${currentStore.name} QR Kod`}
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Bu QR kodu müşteriler tarayarak {currentStore.name} şubesi için<br />
                geri bildirim formuna ulaşabilirler.
              </p>
            </div>
          </div>

          {/* İndirme Butonu */}
          <div className="flex justify-center">
            <Button onClick={downloadQRCode} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              QR Kodu İndir (PNG)
            </Button>
          </div>

          {/* Kullanım Talimatları */}
          <Alert>
            <AlertDescription>
              <strong>Kullanım:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>QR kodu indirip yazdırabilirsiniz</li>
                <li>Şube girişine, kasaya veya müşterilerin görebileceği yerlere asabilirsiniz</li>
                <li>Her şube için farklı QR kod kullanarak hangi şubeden geri bildirim geldiğini takip edebilirsiniz</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}