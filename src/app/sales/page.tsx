"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Calendar,
  Receipt,
  Star
} from "lucide-react"

export default function SalesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")

  const salesData = {
    today: {
      totalSales: 18450,
      totalOrders: 347,
      avgOrderValue: 53.17,
      customers: 267,
      growth: 15.2
    },
    week: {
      totalSales: 124800,
      totalOrders: 2156,
      avgOrderValue: 57.89,
      customers: 1834,
      growth: 8.7
    },
    month: {
      totalSales: 542300,
      totalOrders: 9245,
      avgOrderValue: 58.65,
      customers: 6732,
      growth: 12.4
    }
  }

  const currentData = salesData[selectedPeriod as keyof typeof salesData]

  const recentSales = [
    { id: "#2024-0001", time: "14:35", customer: "Müşteri #1245", items: 5, amount: 67.80, payment: "Nakit" },
    { id: "#2024-0002", time: "14:28", customer: "Müşteri #1246", items: 3, amount: 45.20, payment: "Kart" },
    { id: "#2024-0003", time: "14:15", customer: "Müşteri #1247", items: 8, amount: 124.50, payment: "Kart" },
    { id: "#2024-0004", time: "14:02", customer: "Müşteri #1248", items: 2, amount: 28.90, payment: "Nakit" },
    { id: "#2024-0005", time: "13:58", customer: "Müşteri #1249", items: 6, amount: 89.30, payment: "Kart" },
    { id: "#2024-0006", time: "13:45", customer: "Müşteri #1250", items: 4, amount: 56.40, payment: "Nakit" },
  ]

  const topProducts = [
    { name: "Süt (1L)", sales: 145, revenue: 1232.50, growth: 12.5 },
    { name: "Ekmek (500gr)", sales: 298, revenue: 1192.00, growth: 8.2 },
    { name: "Yumurta (30'lu)", sales: 67, revenue: 1072.00, growth: -3.1 },
    { name: "Domates (1kg)", sales: 89, revenue: 1068.00, growth: 18.7 },
    { name: "Coca Cola (330ml)", sales: 186, revenue: 1023.00, growth: 5.4 },
  ]

  const hourlyData = [
    { hour: "08:00", sales: 245 },
    { hour: "09:00", sales: 420 },
    { hour: "10:00", sales: 680 },
    { hour: "11:00", sales: 890 },
    { hour: "12:00", sales: 1240 },
    { hour: "13:00", sales: 1560 },
    { hour: "14:00", sales: 1680 },
    { hour: "15:00", sales: 1420 },
    { hour: "16:00", sales: 1250 },
    { hour: "17:00", sales: 1180 },
    { hour: "18:00", sales: 980 },
    { hour: "19:00", sales: 760 },
  ]

  return (
    <div className="space-y-6">
      {/* Başlık ve Filtreler */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Satış Analizi
          </h1>
          <p className="text-muted-foreground">Satış performansınızı takip edin</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: "today", label: "Bugün" },
            { key: "week", label: "Bu Hafta" },
            { key: "month", label: "Bu Ay" }
          ].map((period) => (
            <Button
              key={period.key}
              variant={selectedPeriod === period.key ? "default" : "outline"}
              onClick={() => setSelectedPeriod(period.key)}
              size="sm"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₺{currentData.totalSales.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{currentData.growth}%</span> önceki dönemden
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
            <Receipt className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{currentData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Tamamlanan satış</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Sepet</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₺{currentData.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Sipariş başına ortalama</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteri Sayısı</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{currentData.customers}</div>
            <p className="text-xs text-muted-foreground">Alışveriş yapan müşteri</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Son Satışlar */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Son Satışlar
              </CardTitle>
              <CardDescription>
                Gerçek zamanlı satış hareketleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Ödeme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {sale.time}
                        </TableCell>
                        <TableCell>{sale.customer}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{sale.items} ürün</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">₺{sale.amount}</TableCell>
                        <TableCell>
                          <Badge variant={sale.payment === "Kart" ? "default" : "outline"}>
                            {sale.payment}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* En Çok Satan Ürünler */}
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-600" />
              En Çok Satanlar
            </CardTitle>
            <CardDescription>
              Bugünün popüler ürünleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} adet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₺{product.revenue.toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      {product.growth > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-xs ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saatlik Satış Grafiği */}
                <Card className="rounded-2xl shadow-sm bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Saatlik Satış Analizi
          </CardTitle>
          <CardDescription>
            Günün saatlerine göre satış dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 mt-4">
            {hourlyData.map((data, index) => {
              const maxSales = Math.max(...hourlyData.map(d => d.sales))
              const height = (data.sales / maxSales) * 120
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="text-xs font-medium">₺{(data.sales / 1000).toFixed(1)}k</div>
                  <div
                    className="w-8 bg-gray-400 rounded-t-md flex items-end justify-center transition-all duration-300 hover:bg-gray-500"
                    style={{ height: `${height}px` }}
                  ></div>
                  <div className="text-xs text-muted-foreground">{data.hour}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}