"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff, Mail, Lock, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Form validation schemas
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email gereklidir")
    .email("Geçerli bir email adresi girin"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalıdır"),
})

const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "Email gereklidir")
    .email("Geçerli bir email adresi girin"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

const resetSchema = z.object({
  email: z
    .string()
    .min(1, "Email gereklidir")
    .email("Geçerli bir email adresi girin"),
})

type SignInFormData = z.infer<typeof signInSchema>
type SignUpFormData = z.infer<typeof signUpSchema>
type ResetFormData = z.infer<typeof resetSchema>

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = "signin" | "signup" | "reset"

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  
  const { signIn, signUp, resetPassword, loading } = useAuth()

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSignIn = async (data: SignInFormData) => {
    setMessage(null)
    const { error } = await signIn(data.email, data.password)
    
    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Giriş başarılı! Yönlendiriliyorsunuz..." })
      setTimeout(() => {
        onClose()
        setMessage(null)
      }, 1500)
    }
  }

  const onSignUp = async (data: SignUpFormData) => {
    setMessage(null)
    const { error } = await signUp(data.email, data.password)
    
    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Kayıt başarılı! Admin onayı sonrası sisteme giriş yapabileceksiniz." })
      setTimeout(() => {
        setMode("signin")
        setMessage(null)
      }, 3000)
    }
  }

  const onReset = async (data: ResetFormData) => {
    setMessage(null)
    const { error } = await resetPassword(data.email)
    
    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Şifre sıfırlama bağlantısı gönderildi." })
      setTimeout(() => {
        setMode("signin")
        setMessage(null)
      }, 3000)
    }
  }

  const resetAllForms = () => {
    signInForm.reset()
    signUpForm.reset()
    resetForm.reset()
    setMessage(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode)
    resetAllForms()
  }

  const handleClose = () => {
    onClose()
    resetAllForms()
    setMode("signin")
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16  overflow-hidden flex items-center justify-center">
            <Image
              src="https://fbqwaloizdxlxwcddykz.supabase.co/storage/v1/object/public/dmar/dmar.webp"
              alt="DMAR Market Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-2xl font-semibold">
            {mode === "signin" && "Giriş Yap"}
            {mode === "signup" && "Hesap Oluştur"}
            {mode === "reset" && "Şifre Sıfırla"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin" && "Sadece onaylı admin kullanıcılar giriş yapabilir"}
            {mode === "signup" && "Kayıt olduktan sonra admin onayı beklemeniz gerekir"}
            {mode === "reset" && "Şifrenizi sıfırlamak için email adresinizi girin"}
          </DialogDescription>
        </DialogHeader>

        {message && (
          <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Sign In Form */}
        {mode === "signin" && (
          <Form {...signInForm}>
            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="ornek@email.com"
                        disabled={loading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Şifre
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
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

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        )}

        {/* Sign Up Form */}
        {mode === "signup" && (
          <Form {...signUpForm}>
            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
              <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="ornek@email.com"
                        disabled={loading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Şifre
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
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
                control={signUpForm.control}
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
                          type={showConfirmPassword ? "text" : "password"}
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
                {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
              </Button>
            </form>
          </Form>
        )}

        {/* Reset Password Form */}
        {mode === "reset" && (
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="ornek@email.com"
                        disabled={loading}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </Button>
            </form>
          </Form>
        )}

        {/* Mode Switch Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t">
          {mode === "signin" && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                className="h-9"
                onClick={() => handleModeChange("signup")}
              >
                Hesabınız yok mu? <strong className="ml-1">Kayıt olun</strong>
              </Button>
              <Button
                variant="ghost"
                className="h-9 text-muted-foreground"
                onClick={() => handleModeChange("reset")}
              >
                Şifrenizi mi unuttunuz?
              </Button>
            </div>
          )}
          
          {mode === "signup" && (
            <Button
              variant="ghost"
              className="h-9"
              onClick={() => handleModeChange("signin")}
            >
              Zaten hesabınız var mı? <strong className="ml-1">Giriş yapın</strong>
            </Button>
          )}
          
          {mode === "reset" && (
            <Button
              variant="ghost"
              className="h-9"
              onClick={() => handleModeChange("signin")}
            >
              Giriş sayfasına dön
            </Button>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            256-bit SSL Şifreleme
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}