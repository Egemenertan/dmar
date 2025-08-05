"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Auth callback sadece şifre sıfırlama için kullanılıyor
        // Email doğrulama artık kullanılmıyor
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/?error=auth_callback_failed')
          return
        }

        if (data.session) {
          // Başarılı giriş (şifre sıfırlama sonrası)
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          router.push('/?error=no_session')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Giriş Tamamlanıyor</h1>
              <p className="text-muted-foreground mt-2">
                Sisteme yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}