"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BRAND_ASSETS } from "@/lib/constants"
import { useAuth } from "@/contexts/AuthContext"

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
  ChartLine,
  LogOut
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
  onItemClick?: () => void // Mobile'da menü kapanması için
  isMobile?: boolean // Mobile'da toggle butonunu gizlemek için
}

export function Sidebar({ className, onItemClick, isMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()

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
        "flex rounded-2xl m-2 flex-col border border-gray-200 bg-white shadow-sm transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo ve Toggle */}
      <div className={cn(
        "flex items-center p-4 border-b border-gray-200",
        isMobile ? "justify-start" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
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
              <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
              <p className="text-xs text-gray-600 font-medium">DMAR Market</p>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="flex justify-center w-full">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
              <Image
                src={BRAND_ASSETS.logo}
                alt="DMAR Market Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
        )}
        
        {/* Toggle butonu sadece desktop'ta görünür, mobile'da gizli */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-lg",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={onItemClick}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11 text-gray-700 rounded-lg transition-all font-medium",
                    collapsed && "px-2 justify-center",
                    isActive 
                      ? "bg-gray-900 text-white shadow-sm" 
                      : "hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant={
                            item.badge === "Admin" ? "default" : 
                            item.badge === "Acil" ? "destructive" : 
                            "secondary"
                          } 
                          className="text-xs px-2 py-1"
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
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userProfile?.full_name || 'Kullanıcı'}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {user?.email || 'email@example.com'}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <Button
            onClick={() => signOut()}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Çıkış Yap</span>
          </Button>
        </div>
      )}
      
      {/* Collapsed User Avatar */}
      {collapsed && (
        <div className="p-3 flex justify-center border-t border-gray-100">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

