import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Wifi, WifiOff, Volume2 } from 'lucide-react'
import { useAudio } from '../../hooks/useAudio'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

export function VoiceControls() {
  const {
    isRecording,
    isConnectedToGemini,
    audioPermission,
    startRecording,
    stopRecording,
    connectToGemini
  } = useAudio()
  
  const { currentSession } = useAppStore()

  // Auto-connect to Gemini when component mounts and we have a session
  useEffect(() => {
    if (currentSession && !isConnectedToGemini && audioPermission) {
      connectToGemini()
    }
  }, [currentSession, isConnectedToGemini, audioPermission, connectToGemini])

  const handleMicToggle = () => {
    if (!audioPermission) {
      toast.error('Microphone permission required for voice features')
      return
    }

    if (!currentSession) {
      toast.error('Please start a conversation first')
      return
    }

    if (!isConnectedToGemini) {
      toast.error('Connecting to voice assistant...')
      connectToGemini()
      return
    }

    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const getConnectionStatus = () => {
    if (!audioPermission) return { text: 'No mic access', color: 'text-red-400' }
    if (!isConnectedToGemini) return { text: 'Connecting...', color: 'text-yellow-400' }
    return { text: 'Connected', color: 'text-green-400' }
  }

  const status = getConnectionStatus()

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-900/50 border border-gray-700 rounded-xl backdrop-blur-sm">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {isConnectedToGemini ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      </div>

      {/* Voice Recording Button */}
      <div className="flex-1 flex justify-center">
        <motion.button
          onClick={handleMicToggle}
          disabled={!audioPermission || !currentSession}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/50'
              : isConnectedToGemini
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              : 'bg-gray-700 text-gray-400'
          }`}
          whileHover={{ 
            scale: (!audioPermission || !currentSession) ? 1 : 1.05 
          }}
          whileTap={{ 
            scale: (!audioPermission || !currentSession) ? 1 : 0.95 
          }}
          animate={{
            boxShadow: isRecording 
              ? ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 20px rgba(239, 68, 68, 0)']
              : '0 0 0 0 rgba(239, 68, 68, 0)'
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: isRecording ? Infinity : 0,
              ease: 'easeOut'
            }
          }}
        >
          {isRecording ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {/* Recording Pulse */}
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-300"
              animate={{
                scale: [1, 1.3],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
          )}
        </motion.button>
      </div>

      {/* Recording Indicator */}
      <div className="flex items-center space-x-2">
        {isRecording && (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Recording...</span>
          </>
        )}
        {!isRecording && isConnectedToGemini && (
          <span className="text-xs text-gray-400">Tap to speak</span>
        )}
        {!isConnectedToGemini && audioPermission && (
          <Button
            onClick={connectToGemini}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Connect Voice
          </Button>
        )}
      </div>
    </div>
  )
}