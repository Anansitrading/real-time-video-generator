import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Download, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useVideoGeneration } from '../../hooks/useVideoGeneration'
import { useAppStore } from '../../stores/appStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { VIDEO_CONFIG } from '../../lib/constants'
import toast from 'react-hot-toast'

interface VideoGenerationProps {
  onVideoGenerated?: (videoId: string) => void
}

export function VideoGeneration({ onVideoGenerated }: VideoGenerationProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const { generateVideo } = useVideoGeneration()
  const { videos, currentSession } = useAppStore()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video prompt')
      return
    }

    if (!currentSession) {
      toast.error('Please start a conversation first')
      return
    }

    setIsGenerating(true)
    try {
      const video = await generateVideo(
        prompt + VIDEO_CONFIG.defaultPromptSuffix,
        duration
      )
      
      if (video && onVideoGenerated) {
        onVideoGenerated(video.id)
      }
      
      setPrompt('')
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-blue-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'processing':
        return 'Generating...'
      case 'completed':
        return 'Ready'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  // Filter videos for current session
  const sessionVideos = videos.filter(v => v.session_id === currentSession?.id)

  return (
    <div className="space-y-6">
      {/* Video Generation Form */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Generate Video</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video Description
            </label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              className="min-h-[60px]"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific about scenes, actions, and visual details for best results
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration: {duration} seconds
            </label>
            <input
              type="range"
              min="3"
              max={VIDEO_CONFIG.maxDuration}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3s</span>
              <span>{VIDEO_CONFIG.maxDuration}s</span>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim() || !currentSession}
            className="w-full"
            variant="secondary"
          >
            <Video className="w-4 h-4 mr-2" />
            Generate Video
          </Button>
        </div>
      </div>

      {/* Generated Videos */}
      {sessionVideos.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Generated Videos</h3>
          <div className="space-y-3">
            {sessionVideos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 border border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      {video.prompt.length > 60 
                        ? `${video.prompt.substring(0, 60)}...` 
                        : video.prompt
                      }
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(video.status)}
                      <span className="text-xs text-gray-400">
                        {getStatusText(video.status)}
                      </span>
                      {video.duration_seconds && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-xs text-gray-400">
                            {video.duration_seconds}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {video.status === 'completed' && video.video_url && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => window.open(video.video_url, '_blank')}
                        variant="ghost"
                        size="sm"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = video.video_url!
                          a.download = `video-${video.id}.mp4`
                          a.click()
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {video.status === 'failed' && video.error_message && (
                  <p className="text-xs text-red-400 mt-2">
                    {video.error_message}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}