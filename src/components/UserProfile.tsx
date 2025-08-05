"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  email_verified: boolean
  created_at: string
  updated_at: string
  last_sign_in: string | null
}

export function UserProfile() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/protected/user', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setUserData(data.user)
      } else {
        throw new Error(data.error || 'Failed to fetch user data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserProfile()
  }, [user, fetchUserProfile])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Kullanıcı Profili
          <Badge variant="secondary" className="ml-auto">
            <Shield className="w-3 h-3 mr-1" />
            Protected API
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>API Hatası:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <h3 className="font-medium">Middleware Test</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUserProfile}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </Button>
        </div>

        {userData ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{userData.email}</span>
                  {userData.email_verified ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Doğrulandı
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Beklemede
                    </Badge>
                  )}
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">User ID</span>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {userData.id.substring(0, 8)}...
                </span>
              </div>

              {/* Created At */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Kayıt Tarihi</span>
                </div>
                <span className="text-sm">{formatDate(userData.created_at)}</span>
              </div>

              {/* Last Sign In */}
              {userData.last_sign_in && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Son Giriş</span>
                  </div>
                  <span className="text-sm">{formatDate(userData.last_sign_in)}</span>
                </div>
              )}
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Middleware Başarılı:</strong> Protected API&apos;ye erişim sağlandı.
              </AlertDescription>
            </Alert>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kullanıcı verisi yükleniyor...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kullanıcı verisi yüklenemedi</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}