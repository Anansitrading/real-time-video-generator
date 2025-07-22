import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required variables:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY\n\n' +
    'Create a .env.local file in your project root with these variables.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface ChatSession {
  id: string
  user_id: string
  title: string
  language: string
  status: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url?: string
  created_at: string
  metadata: Record<string, any>
}

export interface Video {
  id: string
  session_id: string
  user_id: string
  prompt: string
  fal_request_id?: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  video_url?: string
  thumbnail_url?: string
  duration_seconds?: number
  created_at: string
  completed_at?: string
  error_message?: string
  metadata: Record<string, any>
}

export interface AudioSession {
  id: string
  session_id: string
  gemini_session_id?: string
  status: string
  started_at: string
  ended_at?: string
  metadata: Record<string, any>
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}