'use client'

import { QRCodeGenerator } from "@/components/QRCodeGenerator"

export default function QRGeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            QR Kod Oluşturucu
          </h1>
          <p className="text-lg text-gray-600">
            Şubeleriniz için geri bildirim QR kodları oluşturun
          </p>
        </div>
        
        <QRCodeGenerator />
      </div>
    </div>
  )
}