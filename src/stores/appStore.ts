import { create } from 'zustand'
import { supabase, ChatSession, Message, Video, UserProfile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface AppState {
  // Authentication
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  
  // Chat Sessions
  currentSession: ChatSession | null
  sessions: ChatSession[]
  messages: Message[]
  
  // Videos
  videos: Video[]
  currentVideo: Video | null
  
  // Audio/Voice
  isRecording: boolean
  isConnectedToGemini: boolean
  audioPermission: boolean
  
  // UI State
  isSidebarOpen: boolean
  isVideoModalOpen: boolean
  isSettingsOpen: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setCurrentSession: (session: ChatSession | null) => void
  setSessions: (sessions: ChatSession[]) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setVideos: (videos: Video[]) => void
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  setIsRecording: (recording: boolean) => void
  setIsConnectedToGemini: (connected: boolean) => void
  setAudioPermission: (permission: boolean) => void
  toggleSidebar: () => void
  setVideoModalOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  profile: null,
  isLoading: true,
  currentSession: null,
  sessions: [],
  messages: [],
  videos: [],
  currentVideo: null,
  isRecording: false,
  isConnectedToGemini: false,
  audioPermission: false,
  isSidebarOpen: false,
  isVideoModalOpen: false,
  isSettingsOpen: false,

  // Actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setVideos: (videos) => set({ videos }),
  addVideo: (video) => set((state) => ({ 
    videos: [...state.videos, video] 
  })),
  updateVideo: (id, updates) => set((state) => ({
    videos: state.videos.map(video => 
      video.id === id ? { ...video, ...updates } : video
    )
  })),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setIsConnectedToGemini: (connected) => set({ isConnectedToGemini: connected }),
  setAudioPermission: (permission) => set({ audioPermission: permission }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setVideoModalOpen: (open) => set({ isVideoModalOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setLoading: (loading) => set({ isLoading: loading })
}))