"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { XCircle, AlertTriangle, Shield, X } from 'lucide-react'

const ERROR_MESSAGES = {
  'unauthorized_access': {
    title: 'Erişim Reddedildi',
    message: 'Bu sisteme sadece onaylı admin kullanıcılar erişebilir. Admin yetkisi almak için sistem yöneticisi ile iletişime geçin.',
    icon: Shield,
    variant: 'destructive' as const
  },
  'auth_callback_failed': {
    title: 'Doğrulama Hatası',
    message: 'Email doğrulama işlemi başarısız oldu. Lütfen tekrar deneyin.',
    icon: XCircle,
    variant: 'destructive' as const
  },
  'auth_check_failed': {
    title: 'Yetki Kontrolü Hatası',
    message: 'Yetki kontrolü sırasında bir hata oluştu. Lütfen tekrar giriş yapmayı deneyin.',
    icon: AlertTriangle,
    variant: 'destructive' as const
  },
  'no_session': {
    title: 'Oturum Hatası',
    message: 'Oturum açma işlemi tamamlanamadı. Lütfen tekrar deneyin.',
    icon: XCircle,
    variant: 'destructive' as const
  },
  'unexpected_error': {
    title: 'Beklenmeyen Hata',
    message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
    icon: AlertTriangle,
    variant: 'destructive' as const
  },
  'auth_required': {
    title: 'Giriş Gerekli',
    message: 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.',
    icon: Shield,
    variant: 'default' as const
  },
  'admin_required': {
    title: 'Admin Yetkisi Gerekli',
    message: 'Bu sayfaya sadece onaylı admin kullanıcılar erişebilir.',
    icon: Shield,
    variant: 'destructive' as const
  }
}

export function ErrorBanner() {
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam && ERROR_MESSAGES[errorParam as keyof typeof ERROR_MESSAGES]) {
      setError(errorParam)
      setIsVisible(true)

      // Auto hide after 10 seconds for non-critical errors
      if (!['unauthorized_access', 'admin_required'].includes(errorParam)) {
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, 10000)
        return () => clearTimeout(timer)
      }
    }
  }, [searchParams])

  if (!isVisible || !error) return null

  const errorConfig = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]
  const Icon = errorConfig.icon

  return (
    <div className="mb-6">
      <Alert variant={errorConfig.variant} className="relative">
        <Icon className="h-4 w-4" />
        <AlertDescription className="pr-8">
          <div className="font-semibold mb-1">{errorConfig.title}</div>
          <div>{errorConfig.message}</div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </Alert>
    </div>
  )
}