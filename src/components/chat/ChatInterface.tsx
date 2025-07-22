import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useChatSessions } from '../../hooks/useChatSessions'
import { useAppStore } from '../../stores/appStore'
import { ChatMessage } from './ChatMessage'
import { VoiceControls } from './VoiceControls'
import { VideoGeneration } from '../video/VideoGeneration'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function ChatInterface() {
  const [inputMessage, setInputMessage] = useState('')
  const [showVideoGeneration, setShowVideoGeneration] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, currentSession, addMessageToSession } = useChatSessions()
  const { isLoading } = useAppStore()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return

    const message = inputMessage.trim()
    setInputMessage('')
    
    // Add user message
    await addMessageToSession(message, 'user')
    
    // Check if message is asking for video generation
    const videoKeywords = ['video', 'generate', 'create', 'make', 'produce', 'film']
    const isVideoRequest = videoKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )
    
    if (isVideoRequest && !showVideoGeneration) {
      setShowVideoGeneration(true)
      // Add AI response suggesting video generation
      setTimeout(() => {
        addMessageToSession(
          "I can help you generate a video! Please use the video generation panel below to describe what you'd like to create. Be specific about the scenes, actions, and visual details for the best results.",
          'assistant'
        )
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to Video AI
          </h2>
          <p className="text-gray-400 mb-6">
            Create amazing videos through natural conversation and voice commands. 
            Start a new conversation to begin generating your first video.
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Voice-powered conversations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>AI video generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Real-time collaboration</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to create amazing videos?
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Start by describing what kind of video you'd like to generate, or just say hello to begin our conversation.
            </p>
          </motion.div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Video Generation Panel */}
      {showVideoGeneration && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-700 p-6"
        >
          <VideoGeneration />
        </motion.div>
      )}

      {/* Voice Controls */}
      <div className="border-t border-gray-700 p-4">
        <VoiceControls />
      </div>

      {/* Text Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message... (or use voice controls above)"
              className="pr-12"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => setShowVideoGeneration(!showVideoGeneration)}
            variant={showVideoGeneration ? 'secondary' : 'ghost'}
            className="px-4"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Tip: Mention "video" or "generate" in your message to automatically open video creation tools
        </p>
      </div>
    </div>
  )
}