import { useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, profile, setUser, setProfile, setLoading } = useAppStore()

  useEffect(() => {
    let mounted = true
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await loadUserProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (!mounted) return
        
        const user = session?.user || null
        setUser(user)
        
        if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await loadUserProfile(user.id)
          if (event === 'SIGNED_IN') {
            toast.success('Welcome! You are now signed in.')
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          toast.success('You have been signed out.')
        }
        
        // Ensure loading is false after auth state changes
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      // Try to load existing profile
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (!profile) {
        // Get user data for profile creation
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Create profile for new user
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .upsert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              preferences: {},
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .maybeSingle()
          
          if (createError) {
            console.error('Error creating profile:', createError)
          } else {
            profile = newProfile
          }
        }
      }
      
      setProfile(profile)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    
    if (error) {
      toast.error(error.message)
      throw error
    }
    
    // Check if email confirmation is required
    if (data.user && data.user.email_confirmed_at) {
      // User is already confirmed, they should be signed in
      toast.success('Account created and signed in successfully!')
    } else if (data.user && !data.user.email_confirmed_at) {
      // Email confirmation required
      toast.success('Please check your email to confirm your account.')
    } else {
      // User creation was successful
      toast.success('Account created successfully!')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
  }

  return {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  }
}