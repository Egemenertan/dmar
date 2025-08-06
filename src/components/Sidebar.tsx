"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRAND_ASSETS } from "@/lib/constants"

import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  TrendingUp,
  CreditCard,
  Truck,
  AlertTriangle,
  Settings, 
  ChevronLeft,
  Menu,
  ChartLine
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const allMenuItems = [
    { icon: LayoutDashboard, label: "Ana Panel", href: "/", badge: null },
    { icon: ChartLine, label: "Feedback Analitik", href: "/feedback-analytics", badge: null },
    { icon: Package, label: "Stok Yönetimi", href: "/inventory", badge: null },
    { icon: ShoppingCart, label: "Satışlar", href: "/sales", badge: null },
    { icon: TrendingUp, label: "Raporlar", href: "/reports", badge: null },
    { icon: CreditCard, label: "Kasa", href: "/cashier", badge: null },
    { icon: Truck, label: "Depo", href: "/suppliers", badge: null },
    { icon: AlertTriangle, label: "Kritik Stok", href: "/critical-stock", badge: "Acil" },
    // Admin sayfalar sidebar'dan gizlendi (direct URL erişimi hala korunuyor)
    // { icon: MessageSquare, label: "Şikayetler", href: "/complaints", badge: "Admin" },
    // { icon: QrCode, label: "QR Kod Oluşturucu", href: "/qr-generator", badge: "Admin" },
    // { icon: Users, label: "Kullanıcı Yönetimi", href: "/admin/users", badge: "Admin" },
    { icon: BarChart3, label: "Analitik", href: "/analytics", badge: null },
    { icon: Settings, label: "Ayarlar", href: "/settings", badge: null },
  ]

  // Artık tüm menü öğeleri herkes için görünür (admin sayfalar zaten listeden kaldırıldı)
  const menuItems = allMenuItems

  return (
    <div 
      className={cn(
        "flex rounded-4xl m-1 flex-col border border-gray-200 bg-gray-50  transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo ve Toggle */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src={BRAND_ASSETS.logo}
                alt="DMAR Market Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
              <p className="text-xs text-gray-500">DMAR Market</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 text-gray-600 hover:bg-gray-100",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-13 text-gray-800 rounded-2xl transition-all",
                    collapsed && "px-2 justify-center",
                    isActive 
                      ? "bg-white border border-primary text-primary shadow-sm" 
                      : "hover:border-1 hover:border-primary hover:bg-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant={
                            item.badge === "Admin" ? "default" : 
                            item.badge === "Acil" ? "destructive" : 
                            "secondary"
                          } 
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
        

      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">EY</span>
            </div>
            <div className="flex-1 min-w-0">
             
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

