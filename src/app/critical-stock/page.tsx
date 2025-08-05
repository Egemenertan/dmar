"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  AlertTriangle, 
  ShoppingCart,
  Clock,
  Phone,
  Mail,
  Package
} from "lucide-react"

export default function CriticalStockPage() {
  const criticalProducts = [
    { 
      id: 1, 
      name: "Domates (1kg)", 
      category: "Sebze & Meyve", 
      currentStock: 8, 
      minStock: 25, 
      price: 12.00, 
      supplier: "Taze Manav",
      supplierPhone: "+90 532 123 4567",
      supplierEmail: "siparis@tazemanav.com",
      lastOrder: "3 gün önce",
      urgency: "critical"
    },
    { 
      id: 2, 
      name: "Deterjan (2L)", 
      category: "Temizlik", 
      currentStock: 15, 
      minStock: 20, 
      price: 28.50, 
      supplier: "Ariel",
      supplierPhone: "+90 212 555 0123",
      supplierEmail: "b2b@ariel.com.tr",
      lastOrder: "1 hafta önce",
      urgency: "high"
    },
    { 
      id: 3, 
      name: "Salça (700gr)", 
      category: "Konserve", 
      currentStock: 5, 
      minStock: 30, 
      price: 8.75, 
      supplier: "Tamek",
      supplierPhone: "+90 312 444 8888",
      supplierEmail: "siparis@tamek.com.tr",
      lastOrder: "5 gün önce",
      urgency: "critical"
    },
    { 
      id: 4, 
      name: "Pirinç (1kg)", 
      category: "Temel Gıda", 
      currentStock: 12, 
      minStock: 40, 
      price: 18.50, 
      supplier: "Baldo Pirinç",
      supplierPhone: "+90 466 222 3333",
      supplierEmail: "info@baldopirinc.com",
      lastOrder: "2 hafta önce",
      urgency: "critical"
    },
    { 
      id: 5, 
      name: "Şampuan (400ml)", 
      category: "Kişisel Bakım", 
      currentStock: 18, 
      minStock: 25, 
      price: 24.90, 
      supplier: "Head & Shoulders",
      supplierPhone: "+90 216 123 4567",
      supplierEmail: "orders@pg.com",
      lastOrder: "4 gün önce",
      urgency: "high"
    },
  ]

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Kritik</Badge>
      case 'high':
        return <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600"><Clock className="h-3 w-3" />Yüksek</Badge>
      default:
        return <Badge variant="secondary">Normal</Badge>
    }
  }

  const getStockPercentage = (current: number | undefined, min: number | undefined) => {
    if (!current || !min || min === 0) return 0
    return Math.round((current / min) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            Kritik Stok Uyarıları
          </h1>
          <p className="text-muted-foreground">Acil sipariş gerektiren ürünler</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Tedarikçilere Mail Gönder
          </Button>
          <Button className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Toplu Sipariş Oluştur
          </Button>
        </div>
      </div>

      {/* Uyarı Kartı */}
      <Card className="rounded-2xl shadow-sm bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Acil Dikkat!
          </CardTitle>
          <CardDescription className="text-red-700">
            {criticalProducts.filter(p => p.urgency === 'critical').length} ürün kritik seviyede, 
            {criticalProducts.filter(p => p.urgency === 'high').length} ürün ise yakında kritik seviyeye ulaşacak.
            Stok sıkıntısı yaşamamak için hemen sipariş vermeniz önerilir.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Kritik Ürünler Tablosu */}
      <Card className="rounded-2xl shadow-sm bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-600" />
            Kritik Stok Listesi
          </CardTitle>
          <CardDescription>
            Minimum stok seviyesinin altındaki ürünler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Mevcut/Min Stok</TableHead>
                  <TableHead>Stok %</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Son Sipariş</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalProducts.map((product) => (
                  <TableRow key={product.id} className={product.urgency === 'critical' ? 'bg-red-50/50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">₺{product.price.toFixed(2)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${product.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                          {product.currentStock}
                        </span>
                        <span className="text-muted-foreground">/ {product.minStock}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              getStockPercentage(product.currentStock, product.minStock) < 30 
                                ? 'bg-red-500' 
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(getStockPercentage(product.currentStock, product.minStock), 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {getStockPercentage(product.currentStock, product.minStock)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.supplier}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {product.supplierPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {product.lastOrder}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(product.urgency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Ara
                        </Button>
                        <Button size="sm" className="gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          Sipariş Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hızlı İşlemler */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Önerilen İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2">
                <ShoppingCart className="h-4 w-4" />
                Tüm kritik ürünler için sipariş oluştur
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="h-4 w-4" />
                Tedarikçilere otomatik mail gönder
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <AlertTriangle className="h-4 w-4" />
                Minimum stok seviyelerini güncelle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Stok İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kritik Ürün</span>
                <span className="font-bold text-red-600">{criticalProducts.filter(p => p.urgency === 'critical').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Yüksek Öncelik</span>
                <span className="font-bold text-orange-600">{criticalProducts.filter(p => p.urgency === 'high').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tahmini Sipariş Tutarı</span>
                <span className="font-bold text-gray-900">
                  ₺{criticalProducts.reduce((sum, p) => sum + (p.minStock * p.price), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}