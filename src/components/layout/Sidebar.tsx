import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  MessageCircle, 
  Video, 
  Settings, 
  LogOut,
  X,
  Clock,
  User
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuth } from '../../hooks/useAuth'
import { useChatSessions } from '../../hooks/useChatSessions'
import { Button } from '../ui/Button'
import { formatDistanceToNow } from 'date-fns'

export function Sidebar() {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    setSettingsOpen,
    user,
    profile
  } = useAppStore()
  const { signOut } = useAuth()
  const { sessions, currentSession, createSession, selectSession } = useChatSessions()

  const handleNewSession = async () => {
    await createSession()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toggleSidebar()
    } catch (error) {
      // Error handled in hook
    }
  }

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-full w-80 bg-gray-900/95 border-r border-gray-700 backdrop-blur-xl lg:static lg:z-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white">Video AI</h1>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile */}
              {user && (
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* New Session Button */}
              <div className="p-4">
                <Button
                  onClick={handleNewSession}
                  className="w-full"
                  variant="primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                  Recent Sessions
                </h3>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <motion.button
                      key={session.id}
                      onClick={() => selectSession(session)}
                      className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                        currentSession?.id === session.id
                          ? 'bg-blue-500/20 border border-blue-500/30 text-white'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3">
                        <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  
                  {sessions.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        No conversations yet
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Start a new conversation to begin
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-700 space-y-2">
                <Button
                  onClick={() => setSettingsOpen(true)}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                
                {user && (
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}