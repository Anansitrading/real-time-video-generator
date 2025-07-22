import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChatSession, Message, Video } from '../lib/supabase'

export function useChatSessions() {
  const {
    user,
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
    if (!user) return
    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: { action: 'get_sessions' },
      })
      if (error) throw error
      setSessions(data.data as ChatSession[])
    } catch (e: any) {
      console.error(e)
      toast.error('Could not fetch sessions')
      setSessions([])
    }
  }, [user, setSessions])

  const loadMessages = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return
      try {
        const { data, error } = await supabase.functions.invoke('chat-session-manager', {
          body: { action: 'get_messages', sessionId },
        })
        if (error) throw error
        setMessages(data.data as Message[])
      } catch (e: any) {
        console.error(e)
        toast.error('Could not fetch messages')
        setMessages([])
      }
    },
    [setMessages]
  )

  const loadVideos = useCallback(
    async (sessionId: string) => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
        if (error) throw error
        setVideos(data as Video[])
      } catch (e) {
        console.error(e)
        setVideos([])
      }
    },
    [user, setVideos]
  )

  /* ──────────────────────── MUTATIONS ──────────────────────────── */

  const createSession = useCallback(
    async (title?: string, language = 'en-US') => {
      if (!user) return null
      try {
        const { data, error } = await supabase.functions.invoke('chat-session-manager', {
          body: {
            action: 'create_session',
            sessionData: { title: title || 'New conversation', language, status: 'active' },
          },
        })
        if (error) throw error
        const newSession = data.data as ChatSession
        setSessions((prev) => [newSession, ...prev])
        setCurrentSession(newSession)
        setMessages([])
        setVideos([])
        return newSession
      } catch (e) {
        console.error(e)
        toast.error('Could not create session')
        return null
      }
    },
    [user, setSessions, setCurrentSession, setMessages, setVideos]
  )

  const addMessageToSession = useCallback(
    async (content: string, role: 'user' | 'assistant' = 'user', audioUrl?: string) => {
      if (!currentSession || !user) return
      const message: Message = {
        id: crypto.randomUUID(),
        session_id: currentSession.id,
        role,
        content,
        audio_url: audioUrl,
        created_at: new Date().toISOString(),
        metadata: {},
      }
      addMessage(message) // local optimistic update

      try {
        await supabase.functions.invoke('chat-session-manager', {
          body: { action: 'add_message', sessionId: currentSession.id, messageData: message },
        })
      } catch (e) {
        console.error(e)
        toast.error('Message not saved – offline?')
      }
    },
    [currentSession, user, addMessage]
  )

  const selectSession = useCallback(
    async (s: ChatSession) => {
      setCurrentSession(s)
      await Promise.all([loadMessages(s.id), loadVideos(s.id)])
    },
    [setCurrentSession, loadMessages, loadVideos]
  )

  /* ───────────────────────── EFFECTS ───────────────────────────── */

  // refresh list when user logs in/out
  useEffect(() => {
    if (user) {
      loadSessions()
    } else {
      setSessions([])
      setCurrentSession(null)
      setMessages([])
      setVideos([])
    }
  }, [user, loadSessions, setSessions, setCurrentSession, setMessages, setVideos])

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