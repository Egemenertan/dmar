"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Check if we have the proper tokens in the URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setMessage({ 
        type: 'error', 
        text: 'Geçersiz şifre sıfırlama bağlantısı. Lütfen yeni bir şifre sıfırlama isteği gönderin.' 
      })
      setTimeout(() => router.push('/'), 5000)
    } else {
      // Set the session with the tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [searchParams, router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Şifreniz başarıyla güncellendi! Ana sayfaya yönlendiriliyorsunuz...' 
        })
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch {
      setMessage({ 
        type: 'error', 
        text: 'Bir hata oluştu. Lütfen tekrar deneyin.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Yeni Şifre Belirle</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hesabınız için güvenli bir şifre oluşturun
          </p>
        </CardHeader>

        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Yeni Şifre
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={loading}
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Şifre Tekrar
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={loading}
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-11 w-10"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Güvenli şifre gereklilikleri:</p>
                <ul className="space-y-1">
                  <li>• En az 8 karakter</li>
                  <li>• En az bir büyük harf (A-Z)</li>
                  <li>• En az bir küçük harf (a-z)</li>
                  <li>• En az bir rakam (0-9)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm"
            >
              Ana sayfaya dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}