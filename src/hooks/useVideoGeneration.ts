import { useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useVideoGeneration() {
  const { currentSession, addVideo, updateVideo } = useAppStore()

  const generateVideo = useCallback(async (prompt: string, duration: number = 5) => {
    if (!currentSession) {
      toast.error('No active session')
      return null
    }

    try {
      toast.loading('Starting video generation...', { id: 'video-gen' })
      
      // Call our edge function to start video generation
      const { data, error } = await supabase.functions.invoke('fal-video-generate', {
        body: {
          prompt,
          sessionId: currentSession.id,
          duration
        }
      })

      if (error) throw error

      const videoData = data.data
      
      // Create a video object to add to state
      const video = {
        id: videoData.videoId,
        session_id: currentSession.id,
        user_id: currentSession.user_id,
        prompt,
        fal_request_id: videoData.requestId,
        status: 'queued' as const,
        created_at: new Date().toISOString(),
        metadata: {
          duration,
          estimatedCompletion: videoData.estimatedCompletionTime
        }
      }

      addVideo(video)
      toast.success('Video generation started! It will be ready in ~45 seconds.', { id: 'video-gen' })
      
      return video
      
    } catch (error: any) {
      console.error('Video generation error:', error)
      toast.error(error.message || 'Failed to start video generation', { id: 'video-gen' })
      return null
    }
  }, [currentSession, addVideo])

  const checkVideoStatus = useCallback(async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        updateVideo(videoId, data)
        return data
      }
      
    } catch (error) {
      console.error('Error checking video status:', error)
    }
    
    return null
  }, [updateVideo])

  return {
    generateVideo,
    checkVideoStatus
  }
}