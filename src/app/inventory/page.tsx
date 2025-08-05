"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit3,
  Trash2
} from "lucide-react"

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  const products = [
    { 
      id: 1, 
      name: "Süt (1L)", 
      category: "Süt Ürünleri", 
      stock: 45, 
      minStock: 20, 
      price: 8.50, 
      supplier: "Sütaş",
      status: "normal"
    },
    { 
      id: 2, 
      name: "Ekmek (500gr)", 
      category: "Fırın Ürünleri", 
      stock: 125, 
      minStock: 50, 
      price: 4.00, 
      supplier: "Uno Fırın",
      status: "normal"
    },
    { 
      id: 3, 
      name: "Domates (1kg)", 
      category: "Sebze & Meyve", 
      stock: 8, 
      minStock: 25, 
      price: 12.00, 
      supplier: "Taze Manav",
      status: "critical"
    },
    { 
      id: 4, 
      name: "Deterjan (2L)", 
      category: "Temizlik", 
      stock: 15, 
      minStock: 20, 
      price: 28.50, 
      supplier: "Ariel",
      status: "low"
    },
    { 
      id: 5, 
      name: "Coca Cola (330ml)", 
      category: "İçecekler", 
      stock: 180, 
      minStock: 100, 
      price: 5.50, 
      supplier: "Coca Cola",
      status: "normal"
    },
    { 
      id: 6, 
      name: "Çikolata", 
      category: "Şekerleme", 
      stock: 35, 
      minStock: 30, 
      price: 15.00, 
      supplier: "Ülker",
      status: "normal"
    },
  ]

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string, stock: number, minStock: number) => {
    if (stock <= minStock * 0.3) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Kritik</Badge>
    } else if (stock <= minStock) {
      return <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600"><TrendingDown className="h-3 w-3" />Düşük</Badge>
    } else {
      return <Badge variant="default" className="gap-1 bg-primary"><TrendingUp className="h-3 w-3" />Normal</Badge>
    }
  }

  const stats = {
    totalProducts: products.length,
    criticalStock: products.filter(p => p.stock <= p.minStock * 0.3).length,
    lowStock: products.filter(p => p.stock <= p.minStock && p.stock > p.minStock * 0.3).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve İstatistikler */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stok Yönetimi</h1>
          <p className="text-muted-foreground">Ürün stoklarınızı yönetin ve takip edin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Ürün Ekle
        </Button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Farklı ürün çeşidi</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.criticalStock}</div>
            <p className="text-xs text-muted-foreground">Acil sipariş gerekli</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Düşük Stok</CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Yakında sipariş</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₺{stats.totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Mevcut stok değeri</p>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtreler */}
      <Card className="rounded-2xl shadow-sm bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-600" />
            Ürün Listesi
          </CardTitle>
          <CardDescription>
            Tüm ürünlerinizi görüntüleyin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün adı, kategori veya tedarikçi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrele
            </Button>
          </div>

          {/* Ürün Tablosu */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Min. Stok</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        product.stock <= product.minStock * 0.3 ? 'text-red-600' :
                        product.stock <= product.minStock ? 'text-orange-600' :
                        'text-foreground'
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>{product.minStock}</TableCell>
                    <TableCell>₺{product.price.toFixed(2)}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.stock, product.minStock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
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
    </div>
  )
}