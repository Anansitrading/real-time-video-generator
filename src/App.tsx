import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from './stores/appStore'
import { Sidebar } from './components/layout/Sidebar'
import { ChatInterface } from './components/chat/ChatInterface'

function App() {
  const { toggleSidebar } = useAppStore()

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
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-900/50 border-b border-gray-700 backdrop-blur-xl">
            <div className="flex items-center justify-between h-16 px-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800 lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </div>
                  <h1 className="text-xl font-bold">Video AI</h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-xs text-green-400 font-semibold">DEMO MODE</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Interface */}
          <main className="flex-1 overflow-hidden">
            <ChatInterface />
          </main>
        </div>
      </div>

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