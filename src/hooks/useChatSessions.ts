import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChatSession, Message, Video } from '../lib/supabase'

export function useChatSessions() {
  const {
    currentSession,
    sessions,
    messages,
    videos,
    // setters
    setCurrentSession,
    setSessions,
    setMessages,
    setVideos,
    addMessage,
  } = useAppStore()

  /* ─────────────────────────── LOADERS ─────────────────────────── */

  const loadSessions = useCallback(async () => {
    // Demo mode - create mock sessions
    const mockSessions: ChatSession[] = [
      {
        id: 'demo-1',
        user_id: 'demo-user',
        title: 'Welcome Chat',
        language: 'en-US',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      }
    ]
    setSessions(mockSessions)
  }, [setSessions])

  const loadMessages = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      // Demo mode - start with welcome message
      const welcomeMessage: Message = {
        id: 'welcome-msg',
        session_id: sessionId,
        role: 'assistant',
        content: 'Welcome to Video AI! I can help you create amazing videos through voice conversation. Try saying "Create a video of a sunset over mountains" to get started!',
        created_at: new Date().toISOString(),
        metadata: {}
      }
      setMessages([welcomeMessage])
    },
    [setMessages]
  )

  const loadVideos = useCallback(
    async (sessionId: string) => {
      // Demo mode - no videos initially
      setVideos([])
    },
    [setVideos]
  )

  /* ──────────────────────── MUTATIONS ──────────────────────────── */

  const createSession = useCallback(
    async (title?: string, language = 'en-US') => {
      // Demo mode - create local session
      const newSession: ChatSession = {
        id: `demo-${Date.now()}`,
        user_id: 'demo-user',
        title: title || 'New conversation',
        language,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {}
      }
      setSessions([newSession, ...sessions])
      setCurrentSession(newSession)
      setMessages([])
      setVideos([])
      return newSession
    },
    [setSessions, setCurrentSession, setMessages, setVideos, sessions]
  )

  const addMessageToSession = useCallback(
    async (content: string, role: 'user' | 'assistant' = 'user', audioUrl?: string) => {
      if (!currentSession) return
      const message: Message = {
        id: crypto.randomUUID(),
        session_id: currentSession.id,
        role,
        content,
        audio_url: audioUrl,
        created_at: new Date().toISOString(),
        metadata: {},
      }
      addMessage(message) // local storage in demo mode
      
      // In demo mode, simulate AI response if it's a user message
      if (role === 'user') {
        setTimeout(() => {
          const aiResponse: Message = {
            id: crypto.randomUUID(),
            session_id: currentSession.id,
            role: 'assistant',
            content: `I understand you want to create: "${content}". In a full version, I would generate a video based on your description. This is currently running in demo mode!`,
            created_at: new Date().toISOString(),
            metadata: {},
          }
          addMessage(aiResponse)
        }, 1000)
      }
    },
    [currentSession, addMessage]
  )

  const selectSession = useCallback(
    async (s: ChatSession) => {
      setCurrentSession(s)
      await Promise.all([loadMessages(s.id), loadVideos(s.id)])
    },
    [setCurrentSession, loadMessages, loadVideos]
  )

  /* ───────────────────────── EFFECTS ───────────────────────────── */

  // load demo sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  /* ───────────────────────── EXPORT API ───────────────────────── */

  return {
    // reactive state
    sessions,
    currentSession,
    messages,
    videos,
    // commands
    loadSessions,
    createSession,
    selectSession,
    addMessageToSession,
  }
}