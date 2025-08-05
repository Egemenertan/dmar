"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Calendar,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  is_admin: boolean
  is_approved: boolean
  approval_requested_at: string
  approved_at?: string
  approved_by?: string
  created_at: string
}

export default function AdminUsersPage() {
  const { isApprovedAdmin, user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!isApprovedAdmin) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage({ type: 'error', text: 'Kullanıcılar yüklenirken hata oluştu.' })
    } finally {
      setLoading(false)
    }
  }, [isApprovedAdmin])

  const approveUser = async (userId: string, makeAdmin = false) => {
    setActionLoading(userId)
    setMessage(null)

    try {
      const { error } = await supabase
        .rpc('approve_user', { 
          target_user_id: userId, 
          make_admin: makeAdmin 
        })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: makeAdmin ? 'Kullanıcı admin olarak onaylandı ve sisteme giriş yapabilir.' : 'Kullanıcı onaylandı ancak admin olmadığı için giriş yapamaz.'
      })
      fetchUsers() // Refresh the list
    } catch (error: unknown) {
      console.error('Error approving user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Onaylama işlemi başarısız.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setActionLoading(null)
    }
  }

  const revokeApproval = async (userId: string) => {
    setActionLoading(userId)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_approved: false, 
          is_admin: false,
          approved_at: null,
          approved_by: null 
        })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Kullanıcı onayı iptal edildi.' })
      fetchUsers()
    } catch (error: unknown) {
      console.error('Error revoking approval:', error)
      const errorMessage = error instanceof Error ? error.message : 'Onay iptal işlemi başarısız.'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isApprovedAdmin, fetchUsers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (userProfile: UserProfile) => {
    if (userProfile.is_admin && userProfile.is_approved) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    }
    if (userProfile.is_approved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Onaylı
        </Badge>
      )
    }
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        Beklemede
      </Badge>
    )
  }

  // Only show to approved admins
  if (!isApprovedAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Erişim Reddedildi</h2>
            <p className="text-muted-foreground">
              Bu sayfaya sadece onaylı adminler erişebilir.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Sadece admin kullanıcılar sisteme giriş yapabilir
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tüm Kullanıcılar ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Kullanıcılar yükleniyor...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Henüz kullanıcı yok.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Onay Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userProfile) => (
                  <TableRow key={userProfile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {userProfile.email.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{userProfile.email}</p>
                          {userProfile.full_name && (
                            <p className="text-sm text-muted-foreground">{userProfile.full_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(userProfile)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(userProfile.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {userProfile.approved_at ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CheckCircle className="w-3 h-3" />
                          {formatDate(userProfile.approved_at)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {!userProfile.is_approved && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveUser(userProfile.id, false)}
                              disabled={actionLoading === userProfile.id || userProfile.id === user?.id}
                              className="flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveUser(userProfile.id, true)}
                              disabled={actionLoading === userProfile.id || userProfile.id === user?.id}
                              className="flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" />
                              Admin Yap
                            </Button>
                          </>
                        )}
                        {userProfile.is_approved && userProfile.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeApproval(userProfile.id)}
                            disabled={actionLoading === userProfile.id}
                            className="flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" />
                            Onayı İptal Et
                          </Button>
                        )}
                        {userProfile.id === user?.id && (
                          <Badge variant="secondary" className="text-xs">
                            Siz
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}