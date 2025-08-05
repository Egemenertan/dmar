"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Wifi, WifiOff } from 'lucide-react'

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [connectionTime, setConnectionTime] = useState<number | null>(null)

  useEffect(() => {
    async function checkConnection() {
      try {
        const start = Date.now()
        await supabase
          .from('_dummy_table_that_doesnt_exist')
          .select('*')
          .limit(1)
        
        const end = Date.now()
        setConnectionTime(end - start)
        
        // Tablo bulunamadı hatası normal, bağlantı var demek
        setIsConnected(true)
      } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error)
        setIsConnected(false)
        setConnectionTime(null)
      }
    }

    checkConnection()
    
    // Her 30 saniyede bir bağlantıyı kontrol et
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Veritabanı Durumu
          </CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Kontrol ediliyor...</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Veritabanı Durumu
        </CardTitle>
        <Database className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <Badge variant="default" className="bg-green-600">
                  Bağlı
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <Badge variant="destructive">
                  Bağlantısız
                </Badge>
              </>
            )}
          </div>
          {connectionTime && (
            <p className="text-xs text-muted-foreground">
              Yanıt süresi: {connectionTime}ms
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Supabase: fbqwaloizdxlxwcddykz
          </p>
        </div>
      </CardContent>
    </Card>
  )
}