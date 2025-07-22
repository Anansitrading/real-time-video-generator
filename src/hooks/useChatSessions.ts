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
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: { action: 'get_sessions' }
      })

      if (error) throw error
      setSessions(data.data || [])
      
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }, [user, setSessions])

  // Load messages for current session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: { 
          action: 'get_messages',
          sessionId 
        }
      })

      if (error) throw error
      setMessages(data.data || [])
      
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
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
  const createSession = useCallback(async (title?: string, language: string = 'en') => {
    if (!user) {
      toast.error('Please sign in to create a session')
      return null
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-session-manager', {
        body: {
          action: 'create_session',
          title: title || 'New Conversation',
          language
        }
      })

      if (error) throw error
      
      const newSession = data.data[0]
      setCurrentSession(newSession)
      await loadSessions() // Refresh sessions list
      
      toast.success('New conversation started')
      return newSession
      
    } catch (error: any) {
      console.error('Error creating session:', error)
      toast.error(error.message || 'Failed to create session')
      return null
    }
  }, [user, setCurrentSession, loadSessions])

  // Select a session
  const selectSession = useCallback(async (session: ChatSession) => {
    setCurrentSession(session)
    await Promise.all([
      loadMessages(session.id),
      loadVideos(session.id)
    ])
  }, [setCurrentSession, loadMessages, loadVideos])

  // Add message to current session
  const addMessageToSession = useCallback(async (content: string, role: 'user' | 'assistant' = 'user') => {
    if (!currentSession) {
      toast.error('No active session')
      return null
    }

    try {
      const message = {
        id: crypto.randomUUID(),
        session_id: currentSession.id,
        role,
        content,
        created_at: new Date().toISOString(),
        metadata: {}
      }

      // Add to local state immediately
      addMessage(message)

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
      
    } catch (error: any) {
      console.error('Error adding message:', error)
      toast.error(error.message || 'Failed to add message')
      return null
    }
  }, [currentSession, addMessage])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !currentSession) return

    // Subscribe to messages for current session
    const messagesSubscription = supabase
      .channel(`messages:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentSession.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          addMessage(newMessage)
        }
      )
      .subscribe()

    // Subscribe to video updates for current session
    const videosSubscription = supabase
      .channel(`videos:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `session_id=eq.${currentSession.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const { addVideo } = useAppStore.getState()
            addVideo(payload.new as Video)
          } else if (payload.eventType === 'UPDATE') {
            const { updateVideo } = useAppStore.getState()
            const updated = payload.new as Video
            updateVideo(updated.id, updated)
            
            // Show notification for completed videos
            if (updated.status === 'completed' && updated.video_url) {
              toast.success('🎥 Your video is ready!')
            } else if (updated.status === 'failed') {
              toast.error('❌ Video generation failed')
            }
          }
        }
      )
      .subscribe()

    return () => {
      messagesSubscription.unsubscribe()
      videosSubscription.unsubscribe()
    }
  }, [user, currentSession, addMessage])

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
    sessions,
    currentSession,
    messages,
    videos,
    createSession,
    selectSession,
    addMessageToSession,
    loadSessions
  }
}