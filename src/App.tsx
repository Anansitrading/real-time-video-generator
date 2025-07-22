import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Menu, User, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import { useAppStore } from './stores/appStore'
import { Sidebar } from './components/layout/Sidebar'
import { ChatInterface } from './components/chat/ChatInterface'
import { AuthModal } from './components/auth/AuthModal'
import { Button } from './components/ui/Button'

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { toggleSidebar, isLoading, setLoading } = useAppStore()

  // Fallback to ensure loading doesn't get stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Fallback: Setting loading to false after 3 seconds')
        setLoading(false)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isLoading, setLoading])

  // Auto-open auth modal for testing if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => {
        console.log('Auto-opening auth modal for testing')
        setShowAuthModal(true)
      }, 2000) // Wait 2 seconds after loading completes
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated])

  console.log('App render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email, 'showAuthModal:', showAuthModal)

  const handleSignInClick = () => {
    console.log('handleSignInClick called')
    setShowAuthModal(true)
  }

  const handleGetStartedClick = () => {
    console.log('handleGetStartedClick called')
    setShowAuthModal(true)
  }

  const handleModalClose = () => {
    console.log('handleModalClose called')
    setShowAuthModal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Video AI</h1>
          <p className="text-gray-400">Loading your experience...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #00BFFF 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #39FF14 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        {isAuthenticated && <Sidebar />}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-900/50 border-b border-gray-700 backdrop-blur-xl">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 lg:hidden"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </div>
                  <h1 className="text-xl font-bold">Video AI</h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-gray-300 hidden sm:block">
                      {user?.email}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleSignInClick}
                      variant="primary"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                    <button
                      onClick={() => {
                        console.log('Test button clicked - opening modal')
                        setShowAuthModal(true)
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded font-bold"
                    >
                      TEST AUTH
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Interface */}
          <main className="flex-1 overflow-hidden">
            {isAuthenticated ? (
              <ChatInterface />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex items-center justify-center p-6"
              >
                <div className="text-center max-w-2xl mx-auto">
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/25"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" />
                    </div>
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  >
                    Create Videos with AI
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-gray-400 mb-8 leading-relaxed"
                  >
                    Transform your ideas into stunning videos through natural voice conversations. 
                    Experience the future of content creation with real-time AI video generation.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                  >
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <div className="w-6 h-6 border-2 border-white rounded-full" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Voice Control</h3>
                      <p className="text-gray-400 text-sm">
                        Speak naturally to describe your vision and control video generation
                      </p>
                    </div>
                    
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <div className="w-6 h-6 bg-white rounded" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">AI Generation</h3>
                      <p className="text-gray-400 text-sm">
                        Advanced AI creates high-quality videos from your descriptions
                      </p>
                    </div>
                    
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <div className="w-6 h-6 bg-white rounded-full" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Real-time</h3>
                      <p className="text-gray-400 text-sm">
                        Get instant feedback and generate videos in under a minute
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                  >
                    <Button
                      onClick={handleGetStartedClick}
                      size="lg"
                      className="px-8 py-4 text-lg"
                    >
                      Get Started
                    </Button>
                    
                    {/* Test Instructions */}
                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-300 mb-2">
                        🔬 <strong>Testing Mode:</strong> Auth modal will auto-open in 2 seconds
                      </p>
                      <p className="text-xs text-blue-400">
                        Or click the red "TEST AUTH" button in the header
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleModalClose}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#fff',
            border: '1px solid rgba(75, 85, 99, 0.5)',
            backdropFilter: 'blur(12px)'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </div>
  )
}

export default App