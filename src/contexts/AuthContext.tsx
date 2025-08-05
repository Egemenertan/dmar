"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  is_admin: boolean
  is_approved: boolean
  approval_requested_at: string
  approved_at?: string
  approved_by?: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  isApprovedAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApprovedAdmin, setIsApprovedAdmin] = useState(false)

  // Function to fetch user profile and admin status
  const refreshUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null)
      setIsApprovedAdmin(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
        setIsApprovedAdmin(false)
        return
      }

      setUserProfile(data)
      setIsApprovedAdmin(data.is_admin && data.is_approved)
    } catch (error) {
      console.error('Error in refreshUserProfile:', error)
      setUserProfile(null)
      setIsApprovedAdmin(false)
    }
  }, [user])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        
        // Refresh user profile when auth state changes
        if (session?.user) {
          // Small delay to ensure profile is created by trigger
          setTimeout(() => {
            refreshUserProfile()
          }, 500)
        } else {
          setUserProfile(null)
          setIsApprovedAdmin(false)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [refreshUserProfile])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // First check if user can login (is approved)
      const { data: canLogin, error: checkError } = await supabase
        .rpc('can_user_login', { user_email: email })

      if (checkError) {
        console.error('Error checking user approval:', checkError)
        return { 
          error: { 
            message: checkError.message || 'Kullanıcı kontrolü başarısız.',
            name: 'AuthError'
          } as AuthError 
        }
      }

      if (!canLogin) {
        return { 
          error: { 
            message: 'Bu sisteme sadece onaylı admin kullanıcılar erişebilir. Lütfen admin ile iletişime geçin.',
            name: 'AuthError'
          } as AuthError 
        }
      }

      // Proceed with login if user is approved
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      // Email doğrulama olmadan kayıt ol
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      // Kayıt başarılı ise hemen çıkış yap, admin onayı beklesin
      if (!error && data.user) {
        // Kullanıcı profilinin oluşturulması için kısa bir bekleme sonrası çıkış yap
        setTimeout(async () => {
          await supabase.auth.signOut()
        }, 500)
      }

      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    isApprovedAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}