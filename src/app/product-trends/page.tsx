"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Package,
  BarChart3,
  Filter,
  Search,
  ShoppingCart,
  DollarSign,
  Target
} from "lucide-react"
import { format } from "date-fns"

interface ProductTrend {
  stockId: number
  productName: string
  productCode: string
  categoryCode: string
  categoryName: string
  subCategory: string
  brand: string
  salesCount: number
  totalQuantity: number
  totalRevenue: number
  averagePrice: number
  averageQuantityPerSale: number
  firstSaleDate: string
  lastSaleDate: string
  trendDirection: 'up' | 'down' | 'stable'
  trendPercentage: number
  recentPeriodQuantity: number
  previousPeriodQuantity: number
}

export default function ProductTrendsPage() {
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [sortBy, setSortBy] = useState("quantity")
  const [limit, setLimit] = useState("50")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [trendFilter, setTrendFilter] = useState("all")

  // Date range - always use today
  const getDateRange = () => {
    const today = new Date()
    return {
      startDate: format(today, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    }
  }

  const fetchProductTrends = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams({
        startDate,
        endDate,
        sortBy,
        limit
      })
      
      const response = await fetch(`/api/product-trends?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setProductTrends(data)
      } else if (data.error) {
        throw new Error(data.error)
      } else {
        setProductTrends([])
      }
    } catch (err) {
      console.error('Error fetching product trends:', err)
      setError(err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu')
      setProductTrends([])
    } finally {
      setLoading(false)
    }
  }, [sortBy, limit])

  useEffect(() => {
    fetchProductTrends()
  }, [fetchProductTrends])

  // Filter products based on search and filters
  const filteredProducts = productTrends.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === "all" || 
      product.categoryCode === categoryFilter
    
    const matchesTrend = trendFilter === "all" || 
      product.trendDirection === trendFilter
    
    return matchesSearch && matchesCategory && matchesTrend
  })

  // Get unique categories for filter
  const categories = Array.from(new Set(productTrends.map(p => p.categoryCode)))
    .map(code => ({
      code,
      name: productTrends.find(p => p.categoryCode === code)?.categoryName || code
    }))

  // Summary stats
  const totalProducts = filteredProducts.length
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0)
  const totalQuantity = filteredProducts.reduce((sum, p) => sum + p.totalQuantity, 0)
  const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendBadge = (direction: string, percentage: number) => {
    const variant = direction === 'up' ? 'default' : direction === 'down' ? 'destructive' : 'secondary'
    const prefix = direction === 'up' ? '+' : direction === 'down' ? '' : '±'
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getTrendIcon(direction)}
        {prefix}{percentage.toFixed(1)}%
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num)
  }

  const getDateRangeLabel = () => {
    return "Bugün"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Ürün trend verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ürün Trend Analizi</h1>
          <p className="text-muted-foreground">
            En çok satılan ürünlerin trend analizi ve performans metrikleri
          </p>
        </div>
        <Button onClick={fetchProductTrends} disabled={loading}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Verileri Yenile
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <p className="font-medium">Hata:</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalProducts)}</div>
            <p className="text-xs text-muted-foreground">
              {getDateRangeLabel()} satılan ürün çeşidi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">
              Adet toplam satış miktarı
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Toplam satış geliri
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Fiyat</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-xs text-muted-foreground">
              Ortalama birim fiyat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler ve Sıralama
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sıralama</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Satış Miktarı</SelectItem>
                  <SelectItem value="revenue">Gelir</SelectItem>
                  <SelectItem value="frequency">Satış Sıklığı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">İlk 25</SelectItem>
                  <SelectItem value="50">İlk 50</SelectItem>
                  <SelectItem value="100">İlk 100</SelectItem>
                  <SelectItem value="200">İlk 200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.code} value={cat.code}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Trend</label>
              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Trendler</SelectItem>
                  <SelectItem value="up">Yükseliş</SelectItem>
                  <SelectItem value="down">Düşüş</SelectItem>
                  <SelectItem value="stable">Stabil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Trend Listesi</CardTitle>
          <CardDescription>
            {filteredProducts.length} ürün gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Seçilen kriterlere uygun ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Marka</TableHead>
                    <TableHead className="text-right">Satış Adedi</TableHead>
                    <TableHead className="text-right">Toplam Gelir</TableHead>
                    <TableHead className="text-right">Ort. Fiyat</TableHead>
                    <TableHead className="text-right">Satış Sıklığı</TableHead>
                    <TableHead className="text-center">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow key={`${product.stockId}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.productCode && `Kod: ${product.productCode}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.categoryName}</div>
                          <div className="text-sm text-muted-foreground">{product.subCategory}</div>
                        </div>
                      </TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(product.totalQuantity)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.averagePrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div className="font-medium">{formatNumber(product.salesCount)}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.averageQuantityPerSale.toFixed(1)} adet/satış
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getTrendBadge(product.trendDirection, product.trendPercentage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
