import React from 'react'
import { motion } from 'framer-motion'
import { User, Bot, Volume2 } from 'lucide-react'
import { Message } from '../../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAI = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
          : 'bg-gradient-to-r from-green-500 to-emerald-500'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            : 'bg-gray-800/80 text-gray-100 border border-gray-700'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* Audio Indicator */}
          {message.audio_url && (
            <div className="flex items-center mt-2 pt-2 border-t border-white/20">
              <Volume2 className="w-3 h-3 mr-1" />
              <span className="text-xs opacity-75">Voice message</span>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <p className={`text-xs text-gray-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  )
}