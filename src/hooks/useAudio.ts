import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import { AUDIO_CONFIG } from '../lib/constants'
import toast from 'react-hot-toast'

export function useAudio() {
  const { 
    isRecording, 
    isConnectedToGemini, 
    audioPermission,
    setIsRecording, 
    setIsConnectedToGemini, 
    setAudioPermission 
  } = useAppStore()
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10

  // Initialize audio permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permission = await navigator.mediaDevices.getUserMedia({ audio: true })
        setAudioPermission(true)
        permission.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.error('Audio permission denied:', error)
        setAudioPermission(false)
        toast.error('Microphone access is required for voice features')
      }
    }

    checkPermissions()
  }, [])

  const connectToGemini = useCallback(async () => {
    if (isConnectedToGemini || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Get ephemeral token from our edge function
      const { data: tokenData, error } = await supabase.functions.invoke('gemini-live-token')
      
      if (error) throw error

      const token = tokenData.token
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${token}`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('Connected to Gemini Live')
        setIsConnectedToGemini(true)
        reconnectAttemptsRef.current = 0
        toast.success('Connected to AI voice assistant')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleGeminiMessage(data)
        } catch (error) {
          console.error('Error parsing Gemini message:', error)
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('Gemini WebSocket error:', error)
        toast.error('Voice connection error')
      }
      
      wsRef.current.onclose = () => {
        console.log('Gemini WebSocket closed')
        setIsConnectedToGemini(false)
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          setTimeout(() => {
            reconnectAttemptsRef.current++
            connectToGemini()
          }, delay)
        } else {
          toast.error('Lost connection to voice assistant')
        }
      }
      
    } catch (error) {
      console.error('Failed to connect to Gemini:', error)
      toast.error('Failed to connect to voice assistant')
    }
  }, [isConnectedToGemini, setIsConnectedToGemini])

  const handleGeminiMessage = useCallback((data: any) => {
    // Handle different message types from Gemini Live
    if (data.serverContent?.turnComplete) {
      // AI has finished responding
      console.log('AI turn complete')
    }
    
    if (data.serverContent?.modelTurn?.parts) {
      // Handle AI text response
      const textParts = data.serverContent.modelTurn.parts.filter((part: any) => part.text)
      if (textParts.length > 0) {
        const content = textParts.map((part: any) => part.text).join('');
        // Add AI message to current session
        handleAIResponse(content)
      }
    }

    if (data.serverContent?.interrupted) {
      console.log('AI response interrupted')
    }
  }, [])

  const handleAIResponse = useCallback((content: string) => {
    const { currentSession, addMessage } = useAppStore.getState()
    
    if (currentSession) {
      const message = {
        id: crypto.randomUUID(),
        session_id: currentSession.id,
        role: 'assistant' as const,
        content,
        created_at: new Date().toISOString(),
        metadata: { source: 'gemini-live' }
      }
      
      addMessage(message)
      
      // Save to database
      supabase.functions.invoke('chat-session-manager', {
        body: {
          action: 'add_message',
          sessionId: currentSession.id,
          messageData: message
        }
      })
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!audioPermission) {
      toast.error('Microphone permission required')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      streamRef.current = stream
      audioChunksRef.current = []

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        handleRecordingStop()
      }

      // Set up audio analysis for silence detection
      audioContextRef.current = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      
      // Start silence detection
      startSilenceDetection()
      
      // Auto-stop after max time
      setTimeout(() => {
        if (isRecording) {
          stopRecording()
        }
      }, AUDIO_CONFIG.maxRecordingTime)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Failed to start recording')
    }
  }, [audioPermission, isRecording, setIsRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [isRecording, setIsRecording])

  const startSilenceDetection = useCallback(() => {
    if (!analyserRef.current) return

    const checkSilence = () => {
      if (!analyserRef.current || !isRecording) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const volume = average / 255

      if (volume < AUDIO_CONFIG.silenceThreshold) {
        // Start silence timer if not already started
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (isRecording) {
              stopRecording()
            }
          }, AUDIO_CONFIG.silenceDuration)
        }
      } else {
        // Cancel silence timer if there's sound
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
      }

      if (isRecording) {
        requestAnimationFrame(checkSilence)
      }
    }

    checkSilence()
  }, [isRecording, stopRecording])

  const handleRecordingStop = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
      
      // Convert to base64 for sending to Gemini
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Audio = reader.result as string
        sendAudioToGemini(base64Audio)
      }
      reader.readAsDataURL(audioBlob)
      
    } catch (error) {
      console.error('Error processing audio:', error)
      toast.error('Error processing audio recording')
    }
  }, [])

  const sendAudioToGemini = useCallback((audioData: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected to voice assistant')
      return
    }

    try {
      // Extract base64 data
      const base64Data = audioData.split(',')[1]
      
      const message = {
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{
              inlineData: {
                mimeType: 'audio/webm;codecs=opus',
                data: base64Data
              }
            }]
          }],
          turnComplete: true
        }
      }

      wsRef.current.send(JSON.stringify(message))
      console.log('Audio sent to Gemini')
      
    } catch (error) {
      console.error('Error sending audio to Gemini:', error)
      toast.error('Failed to send audio to AI')
    }
  }, [])

  return {
    isRecording,
    isConnectedToGemini,
    audioPermission,
    startRecording,
    stopRecording,
    connectToGemini,
  }
}