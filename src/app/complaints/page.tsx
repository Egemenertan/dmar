'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { 
  MessageSquare, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Mail, 
  Phone,
  Calendar,
  User,
  Filter,
  RefreshCw,
  MapPin
} from "lucide-react"
// Date formatting utility
const formatDate = (dateString: string, includeTime = false) => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('tr-TR', options)
}

interface Complaint {
  id: string
  full_name: string
  email: string
  phone?: string
  complaint_type: 'complaint' | 'request' | 'suggestion'
  subject: string
  message: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
  response_message?: string
  // Store bilgileri
  store_id?: string
  store_name?: string
  store_location?: string
}

export default function ComplaintsPage() {
  const { user, isApprovedAdmin } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [newPriority, setNewPriority] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching complaints:', error)
        return
      }

      setComplaints(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  // Admin kontrolü
  if (!isApprovedAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bu sayfaya erişim için admin yetkisine sahip olmanız gerekiyor.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !user) return
    
    setIsUpdating(true)
    try {
      const updateData: Record<string, string> = {
        updated_at: new Date().toISOString()
      }

      if (newStatus) {
        updateData.status = newStatus
        if (newStatus === 'resolved' || newStatus === 'closed') {
          updateData.resolved_at = new Date().toISOString()
          updateData.resolved_by = user.id
        }
      }

      if (newPriority) {
        updateData.priority = newPriority
      }

      if (responseMessage.trim()) {
        updateData.response_message = responseMessage.trim()
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', selectedComplaint.id)

      if (error) {
        console.error('Error updating complaint:', error)
        return
      }

      // Listeyi yenile
      await fetchComplaints()
      
      // Dialog'u kapat
      setSelectedComplaint(null)
      setResponseMessage('')
      setNewStatus('')
      setNewPriority('')

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Bekliyor', variant: 'secondary' as const, icon: Clock },
      in_progress: { label: 'İşlemde', variant: 'default' as const, icon: RefreshCw },
      resolved: { label: 'Çözüldü', variant: 'default' as const, icon: CheckCircle },
      closed: { label: 'Kapatıldı', variant: 'outline' as const, icon: CheckCircle }
    }
    
    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'Düşük', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Orta', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Yüksek', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Acil', className: 'bg-red-100 text-red-800' }
    }
    
    const { label, className } = config[priority as keyof typeof config] || config.medium
    
    return (
      <Badge className={className}>
        {label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const config = {
      complaint: { label: 'Şikayet', className: 'bg-red-100 text-red-800' },
      request: { label: 'Talep', className: 'bg-blue-100 text-blue-800' },
      suggestion: { label: 'Öneri', className: 'bg-green-100 text-green-800' }
    }
    
    const { label, className } = config[type as keyof typeof config] || config.suggestion
    
    return (
      <Badge className={className}>
        {label}
      </Badge>
    )
  }

  // Filtreleme
  const filteredComplaints = complaints.filter(complaint => {
    const statusMatch = filterStatus === 'all' || complaint.status === filterStatus
    const typeMatch = filterType === 'all' || complaint.complaint_type === filterType
    return statusMatch && typeMatch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Yükleniyor...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Şikayetler & Geri Bildirimler</h1>
          <p className="text-muted-foreground">
            Müşteri geri bildirimlerini yönetin ve yanıtlayın
          </p>
        </div>
        <Button onClick={fetchComplaints} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaints.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşlemde</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çözülen</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="pending">Bekleyen</SelectItem>
                  <SelectItem value="in_progress">İşlemde</SelectItem>
                  <SelectItem value="resolved">Çözülen</SelectItem>
                  <SelectItem value="closed">Kapatılan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tür</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="complaint">Şikayet</SelectItem>
                  <SelectItem value="request">Talep</SelectItem>
                  <SelectItem value="suggestion">Öneri</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Şikayetler Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Geri Bildirimler ({filteredComplaints.length})</CardTitle>
          <CardDescription>
            Müşterilerden gelen tüm geri bildirimler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kişi</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{complaint.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {complaint.email}
                        </div>
                        {complaint.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {complaint.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {complaint.store_name ? (
                          <>
                            <div className="font-medium text-sm">{complaint.store_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {complaint.store_location || 'Konum belirtilmemiş'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">Şube belirtilmemiş</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(complaint.complaint_type)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-medium">
                        {complaint.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(complaint.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(complaint.priority)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(complaint.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint)
                              setNewStatus(complaint.status)
                              setNewPriority(complaint.priority)
                              setResponseMessage(complaint.response_message || '')
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detay
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Geri Bildirim Detayı
                            </DialogTitle>
                            <DialogDescription>
                              {complaint.subject} - {complaint.full_name}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedComplaint && (
                            <div className="space-y-6">
                              {/* Kişi Bilgileri */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-gray-500" />
                                    {selectedComplaint.full_name}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">E-posta</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    {selectedComplaint.email}
                                  </div>
                                </div>
                                {selectedComplaint.phone && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Telefon</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Phone className="h-4 w-4 text-gray-500" />
                                      {selectedComplaint.phone}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Tarih</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    {formatDate(selectedComplaint.created_at, true)}
                                  </div>
                                </div>
                              </div>

                              {/* Geri Bildirim Detayları */}
                              <div className="space-y-4">
                                <div className="flex gap-4">
                                  {getTypeBadge(selectedComplaint.complaint_type)}
                                  {getStatusBadge(selectedComplaint.status)}
                                  {getPriorityBadge(selectedComplaint.priority)}
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Konu</label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                    {selectedComplaint.subject}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Mesaj</label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                                    {selectedComplaint.message}
                                  </div>
                                </div>
                              </div>

                              {/* Yanıt ve Güncelleme */}
                              <div className="space-y-4 border-t pt-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Durum Güncelle</label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Bekleyen</SelectItem>
                                        <SelectItem value="in_progress">İşlemde</SelectItem>
                                        <SelectItem value="resolved">Çözüldü</SelectItem>
                                        <SelectItem value="closed">Kapatıldı</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Öncelik Güncelle</label>
                                    <Select value={newPriority} onValueChange={setNewPriority}>
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Düşük</SelectItem>
                                        <SelectItem value="medium">Orta</SelectItem>
                                        <SelectItem value="high">Yüksek</SelectItem>
                                        <SelectItem value="urgent">Acil</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Yanıt Mesajı</label>
                                  <Textarea
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="Müşteriye yanıt mesajınızı yazın..."
                                    rows={4}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <Button 
                                  onClick={handleUpdateComplaint}
                                  disabled={isUpdating}
                                  className="w-full"
                                >
                                  {isUpdating ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Güncelleniyor...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Güncelle
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredComplaints.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Henüz hiç geri bildirim bulunmuyor.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}