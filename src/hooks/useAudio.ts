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

  // Initialize audio permissions with browser compatibility checks
  useEffect(() => {
    const checkPermissions = async () => {
      // Check if MediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not supported')
        setAudioPermission(false)
        toast.error('Voice features are not supported in this browser. Please use Chrome, Firefox, or Safari.')
        return
      }

      // Check if AudioContext is supported
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.warn('AudioContext not supported')
        setAudioPermission(false)
        toast.error('Audio processing is not supported in this browser.')
        return
      }

      try {
        // Test audio permission
        const permission = await navigator.mediaDevices.getUserMedia({ audio: true })
        setAudioPermission(true)
        permission.getTracks().forEach(track => track.stop())
        console.log('Audio permissions granted')
      } catch (error: any) {
        console.error('Audio permission denied:', error)
        setAudioPermission(false)
        
        // Provide specific error messages based on error type
        if (error.name === 'NotAllowedError') {
          toast.error('Microphone access denied. Please allow microphone access in your browser settings.')
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found. Please check your audio devices.')
        } else if (error.name === 'NotReadableError') {
          toast.error('Microphone is being used by another application.')
        } else {
          toast.error(`Audio setup failed: ${error.message}`)
        }
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
      
      if (error) {
        console.error('Token error:', error)
        throw new Error(`Failed to get token: ${error.message}`)
      }

      if (!tokenData?.data?.token) {
        throw new Error('Invalid token response')
      }

      const token = tokenData.data.token
      // Use the correct Gemini Live WebSocket URL format for native audio dialog
      const wsUrl = `wss://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-preview-native-audio-dialog:streamGenerateContent?alt=sse&key=${token}`
      
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
        
        // Provide more specific error feedback
        if (reconnectAttemptsRef.current === 0) {
          toast.error('Voice connection failed. Retrying...')
        } else if (reconnectAttemptsRef.current < maxReconnectAttempts / 2) {
          toast.error(`Connection issues. Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
        }
      }
      
      wsRef.current.onclose = (event) => {
        console.log('Gemini WebSocket closed:', event.code, event.reason)
        setIsConnectedToGemini(false)
        
        // Don't retry if close was intentional
        if (event.wasClean) {
          console.log('WebSocket closed cleanly')
          return
        }
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
          
          setTimeout(() => {
            reconnectAttemptsRef.current++
            connectToGemini()
          }, delay)
        } else {
          toast.error('Unable to connect to voice assistant. Please check your internet connection and try again.')
          reconnectAttemptsRef.current = 0 // Reset for future attempts
        }
      }
      
    } catch (error) {
      console.error('Failed to connect to Gemini:', error)
      toast.error(`Voice connection failed: ${error.message}`)
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
      toast.error('Microphone permission required. Please enable microphone access.')
      return
    }

    if (isRecording) {
      console.log('Recording already in progress')
      return
    }

    try {
      // Clean up any existing resources first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
      }

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

      // Check MediaRecorder support
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']
      let supportedMimeType = ''
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          supportedMimeType = mimeType
          break
        }
      }

      if (!supportedMimeType) {
        throw new Error('No supported audio format found')
      }

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        handleRecordingStop()
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        toast.error('Recording error occurred')
        stopRecording()
      }

      // Set up audio analysis for silence detection with fallback
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate })
        
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)

        // Start silence detection
        startSilenceDetection()
      } catch (audioContextError) {
        console.warn('Audio analysis not available, using basic recording:', audioContextError)
        // Continue without silence detection
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      console.log(`Recording started with format: ${supportedMimeType}`)
      
      // Auto-stop after max time
      setTimeout(() => {
        if (isRecording) {
          console.log('Auto-stopping recording after max time')
          stopRecording()
        }
      }, AUDIO_CONFIG.maxRecordingTime)
      
    } catch (error: any) {
      console.error('Failed to start recording:', error)
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please check your audio devices.')
      } else if (error.name === 'NotReadableError') {
        toast.error('Microphone is busy. Please close other applications using the microphone.')
      } else {
        toast.error(`Recording failed: ${error.message}`)
      }
      
      // Clean up on failure
      setIsRecording(false)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [audioPermission, isRecording, setIsRecording])

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...')
    
    try {
      if (mediaRecorderRef.current && isRecording) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }
      setIsRecording(false)
    } catch (error) {
      console.error('Error stopping MediaRecorder:', error)
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped track: ${track.kind}`)
      })
      streamRef.current = null
    }

    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(error => {
        console.error('Error closing AudioContext:', error)
      })
      audioContextRef.current = null
    }

    // Reset analyser
    analyserRef.current = null
  }, [isRecording, setIsRecording])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up audio hook...')
      
      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      
      // Stop recording if active
      if (isRecording) {
        stopRecording()
      }
      
      // Clear any pending timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, []) // Empty dependency array for cleanup on unmount only

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
    if (!wsRef.current) {
      toast.error('Voice assistant not initialized')
      return
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      if (wsRef.current.readyState === WebSocket.CONNECTING) {
        toast.error('Still connecting to voice assistant, please wait...')
      } else if (wsRef.current.readyState === WebSocket.CLOSING) {
        toast.error('Voice assistant connection is closing')
      } else {
        toast.error('Voice assistant disconnected, attempting to reconnect...')
        connectToGemini() // Attempt to reconnect
      }
      return
    }

    try {
      // Validate audio data format
      if (!audioData || !audioData.includes(',')) {
        throw new Error('Invalid audio data format')
      }

      // Extract base64 data
      const base64Data = audioData.split(',')[1]
      if (!base64Data) {
        throw new Error('No audio data found')
      }
      
      // Determine the correct MIME type based on the data URL
      const mimeType = audioData.split(',')[0].split(':')[1].split(';')[0] || 'audio/webm;codecs=opus'
      
      const message = {
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{
              inlineData: {
                mimeType,
                data: base64Data
              }
            }]
          }],
          turnComplete: true
        }
      }

      const messageString = JSON.stringify(message)
      
      // Check message size (WebSocket has limits)
      if (messageString.length > 1024 * 1024) { // 1MB limit
        throw new Error('Audio message too large')
      }

      wsRef.current.send(messageString)
      console.log(`Audio sent to Gemini (${(base64Data.length * 0.75 / 1024).toFixed(2)}KB, ${mimeType})`)
      
    } catch (error: any) {
      console.error('Error sending audio to Gemini:', error)
      
      if (error.message.includes('Invalid audio data')) {
        toast.error('Audio recording failed, please try again')
      } else if (error.message.includes('too large')) {
        toast.error('Audio message too long, please record shorter clips')
      } else {
        toast.error(`Failed to send audio: ${error.message}`)
      }
    }
  }, [connectToGemini])

  return {
    isRecording,
    isConnectedToGemini,
    audioPermission,
    startRecording,
    stopRecording,
    connectToGemini,
  }
}