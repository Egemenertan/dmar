"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"


import { 
  Package, 
  ShoppingCart, 
  DollarSign,
  Activity,
  Calendar,
  AlertTriangle,
  BarChart3
} from "lucide-react"

export default function Home() {
  
  return (
    <div className="space-y-6">
      {/* Üst İstatistik Kartları */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Günlük Satış
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₺18,450</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.2%</span> dünden
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Ürün
            </CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23</span> yeni ürün
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Günlük Sipariş
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">347</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.1%</span> bu hafta
            </p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kritik Stok
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">Acil Sipariş</span> gerekli
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alt Bölüm - Son Aktiviteler ve Analitik */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sol Kısım - Son Satışlar */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Son Satışlar
              </CardTitle>
              <CardDescription>
                Günün en son satış işlemleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { customer: "Müşteri #1245", item: "Süt, Ekmek, Yumurta", amount: "₺28.50", time: "2 dakika önce", type: "sale" },
                  { customer: "Müşteri #1246", item: "Deterjan, Şampuan", amount: "₺45.20", time: "5 dakika önce", type: "sale" },
                  { customer: "Tedarikçi", item: "Sebze Stoğu Eklendi", amount: "+150 adet", time: "10 dakika önce", type: "stock" },
                  { customer: "Müşteri #1247", item: "İçecek, Cips, Çikolata", amount: "₺67.80", time: "15 dakika önce", type: "sale" },
                  { customer: "Sistem", item: "Kritik stok uyarısı", amount: "Domates", time: "22 dakika önce", type: "warning" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'sale' ? 'bg-gray-100 text-gray-600' :
                        activity.type === 'stock' ? 'bg-gray-100 text-gray-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'sale' ? <DollarSign className="h-4 w-4" /> :
                         activity.type === 'stock' ? <Package className="h-4 w-4" /> :
                         <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.customer}</p>
                        <p className="text-xs text-muted-foreground">{activity.item}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        activity.type === 'sale' ? 'default' : 
                        activity.type === 'stock' ? 'secondary' : 
                        'destructive'
                      }>
                        {activity.amount}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kısım - Hızlı İstatistikler */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-2xl shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                Bugünkü Özet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Toplam Satış</span>
                  <span className="text-sm font-bold text-gray-900">₺18,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Satış Adedi</span>
                  <span className="text-sm font-medium">347</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Yeni Müşteri</span>
                  <span className="text-sm font-medium">+12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Bekleyen Sipariş</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kasa Durumu</span>
                  <Badge variant="default">Açık</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Stok Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Gıda Ürünleri</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full w-[85%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Temizlik Ürünleri</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full w-[65%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">İçecekler</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full w-[92%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Sebze & Meyve</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full w-[23%]"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

         
        </div>
      </div>
    </div>
  )
}
