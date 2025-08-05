"use client"

import { useState } from "react"
import { Bell, Search, User, LogOut, Shield, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/contexts/AuthContext"
import { AuthModal } from "@/components/AuthModal"

export function Header() {
  const { user, signOut, loading } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const getUserInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-3xl m-1 shadow-sm">
        {/* Sol Kısım - Başlık */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dmar Yönetim</h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Hoş geldiniz, ${user.email?.split('@')[0]}!` : "DMAR Market'e hoş geldiniz"}
            </p>
          </div>
        </div>

        {/* Orta Kısım - Arama (sadece giriş yapmış kullanıcılar için) */}
        {user && (
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün, kategori veya tedarikçi ara..."
                className="pl-10 w-full"
              />
            </div>
          </div>
        )}

        {/* Sağ Kısım - Feedback, Auth ve Profil */}
        <div className="flex items-center gap-4">
          {/* Feedback Butonu - Herkese açık */}
          <Link href="/feedback" target="_blank">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              <MessageSquare className="w-4 h-4" />
              Geri Bildirim
            </Button>
          </Link>

          {user ? (
            // Giriş yapmış kullanıcı için
            <>
              {/* Bildirimler */}
              <Button variant="ghost" size="icon" className="relative">
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
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Giriş Yap
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