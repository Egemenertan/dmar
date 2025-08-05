"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ErrorBanner } from "@/components/ErrorBanner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  
  // Feedback sayfası için özel layout (giriş gerektirmez)
  if (pathname === '/feedback') {
    return (
      <div className="min-h-screen bg-[#f1f1f1]">
        {children}
      </div>
    )
  }
  
  // Diğer tüm sayfalar için normal dashboard layout
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#f1f1f1]">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Ana İçerik Alanı */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Ana İçerik */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
            <ErrorBanner />
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}