"use client"

import { useState } from "react"
import { Bell, User, LogOut, Shield, Menu } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/AuthContext"
import { AuthModal } from "@/components/AuthModal"
import { BRAND_ASSETS } from "@/lib/constants"
import { Sidebar } from "@/components/Sidebar"

interface HeaderProps {
  onMobileSidebarToggle?: () => void
}

export function Header({ onMobileSidebarToggle }: HeaderProps) {
  const { user, signOut, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-3xl m-1 shadow-sm">
        {/* Sol Kısım - Mobile Hamburger + Logo + Başlık */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Menu - Sadece mobilde görünür */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-8 w-8"
                onClick={() => {
                  setIsMobileMenuOpen(true)
                  onMobileSidebarToggle?.()
                }}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menüyü aç</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar 
                className="border-0 m-0 rounded-none h-full" 
                onItemClick={() => setIsMobileMenuOpen(false)}
                isMobile={true}
              />
            </SheetContent>
          </Sheet>

          {/* Logo - Mobilde gösteriliyor */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src={BRAND_ASSETS.logo}
                alt="DMAR Market Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Dmar Yönetim</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {user ? `Hoş geldiniz, ${user.email?.split('@')[0]}!` : "DMAR Market'e hoş geldiniz"}
              </p>
            </div>
            {/* Mobilde sadece başlık */}
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Dmar</h1>
            </div>
          </div>
        </div>

        {/* Orta Kısım - Arama (sadece desktop'ta ve giriş yapmış kullanıcılar için) */}
      

        {/* Sağ Kısım - Feedback, Auth ve Profil */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Feedback Butonu - Responsive */}
        

          {user ? (
            // Giriş yapmış kullanıcı için
            <>
              {/* Bildirimler - Sadece desktop'ta görünür */}
              <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>

              {/* Profil Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Bildirimler</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={handleSignOut}
                    disabled={loading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // Giriş yapmamış kullanıcı için
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2"
              >
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Giriş Yap</span>
                <span className="sm:hidden">Giriş</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}