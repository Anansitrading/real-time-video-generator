import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase, ChatSession, Message, Video } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useChatSessions() {
  const { 
    user, 
    currentSession, 
    sessions, 
    messages,
    videos,
    setCurrentSession, 
    setSessions, 
    setMessages,
    setVideos,
    addMessage 
  } = useAppStore()

  // Load user's chat sessions
  const loadSessions = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping session load')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: { action: 'get_sessions' }
      })

      if (error) {
        console.error('Session loading error:', error)
        throw new Error(error.message || 'Failed to load chat sessions')
      }

      if (!data || !data.data) {
        console.warn('No session data received')
        setSessions([])
        return
      }

      setSessions(data.data)
      console.log(`Loaded ${data.data.length} chat sessions`)
      
    } catch (error: any) {
      console.error('Error loading sessions:', error)
      setSessions([])
      
      // Provide user feedback for network or auth issues
      if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
        toast.error('Session access denied. Please sign in again.')
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error loading sessions. Please check your connection.')
      } else {
        toast.error('Failed to load chat sessions. Please refresh the page.')
      }
    }
  }, [user, setSessions])

  // Load messages for current session
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      console.warn('No session ID provided for message loading')
      setMessages([])
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: { 
          action: 'get_messages',
          sessionId 
        }
      })

      if (error) {
        console.error('Message loading error:', error)
        throw new Error(error.message || 'Failed to load messages')
      }

      const messages = data?.data || []
      setMessages(messages)
      console.log(`Loaded ${messages.length} messages for session ${sessionId}`)
      
    } catch (error: any) {
      console.error('Error loading messages:', error)
      setMessages([])
      
      // Only show toast for unexpected errors, not normal empty states
      if (!error.message?.includes('not found') && !error.message?.includes('no messages')) {
        toast.error('Failed to load conversation history')
      }
    }
  }, [setMessages])

  // Load videos for current session
  const loadVideos = useCallback(async (sessionId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
      
    } catch (error) {
      console.error('Error loading videos:', error)
      setVideos([])
    }
  }, [user, setVideos])

  // Create new chat session
  const createSession = useCallback(async (title?: string, language = 'en-US') => {
    if (!user) return null

    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: {
          action: 'create_session',
          sessionData: {
            title: title || `Chat ${new Date().toLocaleDateString()}`,
            language,
            status: 'active'
          }
        }
      })

      if (error) throw error
      
      const newSession = data.data
      setSessions(prev => [newSession, ...prev])
      setCurrentSession(newSession)
      setMessages([])
      setVideos([])
      
      return newSession
      
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Failed to create new conversation')
      return null
    }
  }, [user, setSessions, setCurrentSession, setMessages, setVideos])

  // Switch to a different session
  const switchSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session)
    await loadMessages(session.id)
    await loadVideos(session.id)
  }, [setCurrentSession, loadMessages, loadVideos])

  // Send message to current session
  const sendMessage = useCallback(async (content: string, audioUrl?: string) => {
    if (!currentSession || !user) return null

    const message: Message = {
      id: crypto.randomUUID(),
      session_id: currentSession.id,
      role: 'user',
      content,
      audio_url: audioUrl,
      created_at: new Date().toISOString(),
      metadata: {}
    }

    // Add to local state immediately
    addMessage(message)

    try {
      // Save to database
      const { error } = await supabase.functions.invoke('chat-session-manager', {
        body: {
          action: 'add_message',
          sessionId: currentSession.id,
          messageData: message
        }
      })

      if (error) throw error
      return message
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      return null
    }
  }, [currentSession, user, addMessage])

  // Load sessions when user changes
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

  return {
    loadSessions,
    loadMessages,
    loadVideos,
    createSession,
    switchSession,
    sendMessage
  }
}