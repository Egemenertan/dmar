"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthModal } from '@/components/AuthModal'
import { supabase } from '@/lib/supabase'
import { Loader2, Shield, Lock, XCircle, CheckCircle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, userProfile, isApprovedAdmin, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Ekstra güvenlik: Kullanıcı session'a sahip ama admin değilse çıkış yaptır
  useEffect(() => {
    if (user && userProfile && !isApprovedAdmin) {
      const checkAndSignOut = async () => {
        console.log('Non-admin user detected, signing out...')
        await supabase.auth.signOut()
      }
      checkAndSignOut()
    }
  }, [user, userProfile, isApprovedAdmin])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Yükleniyor</h1>
                <p className="text-muted-foreground mt-2">
                  Oturum durumunuz kontrol ediliyor...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated but not admin or not approved
  if (user && userProfile && !isApprovedAdmin) {
    const isNotAdmin = !userProfile.is_admin
    const isNotApproved = !userProfile.is_approved
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Erişim Reddedildi</h1>
                <p className="text-muted-foreground">
                  Bu sisteme sadece onaylı admin kullanıcılar erişebilir.
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Admin Durumu</span>
                    <Badge variant={isNotAdmin ? "destructive" : "default"}>
                      {isNotAdmin ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Admin Değil
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Onay Durumu</span>
                    <Badge variant={isNotApproved ? "destructive" : "default"}>
                      {isNotApproved ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Onaysız
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Onaylı
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kayıt Tarihi</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(userProfile.approval_requested_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await supabase.auth.signOut()
                  }}
                >
                  Çıkış Yap
                </Button>
              </div>

              <div className="w-full pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Sadece Admin Erişimi:</strong><br/>
                  {isNotAdmin && "Admin yetkisi gereklidir. "}
                  {isNotApproved && "Admin onayı gereklidir. "}
                  Lütfen sistem yöneticisi ile iletişime geçin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-[#f1f1f1] p-4">
          <Card className="w-full bg-[#f1f1f1] max-w-md ">
            <CardContent className="pt-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Logo */}
                <div className="w-20 h-20 overflow-hidden flex items-center justify-center">
                  <Image
                    src="https://fbqwaloizdxlxwcddykz.supabase.co/storage/v1/object/public/dmar/dmar.webp"
                    alt="DMAR Market Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold text-gray-800">Giriş Gerekli</h1>
                  <p className="text-gray-600">
                    Bu sayfaya erişmek için giriş yapmanız gerekmektedir.
                  </p>
                </div>
                
                <div className="w-full">
                  <Button
                    className="w-full h-12 rounded-2xl text-base font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    Giriş Yap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </>
    )
  }

  // Authenticated - show protected content
  return <>{children}</>
}