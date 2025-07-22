export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  maxRecordingTime: 60000, // 60 seconds
  silenceThreshold: 0.01,
  silenceDuration: 1500 // 1.5 seconds
}

export const VIDEO_CONFIG = {
  maxDuration: 30,
  aspectRatio: '16:9',
  defaultPromptSuffix: ', cinematic quality, 4k resolution'
}

export const WEBSOCKET_CONFIG = {
  maxReconnectAttempts: 10,
  reconnectBackoffMs: 1000,
  heartbeatIntervalMs: 30000
}

export const PERFORMANCE_CONFIG = {
  audioLatencyTargetMs: 150,
  realtimeLatencyTargetMs: 1000,
  bundleSizeTargetKb: 500
}

export const UI_CONSTANTS = {
  colors: {
    neonBlue: '#00BFFF',
    neonGreen: '#39FF14',
    darkBg: '#0a0a0a',
    cardBg: 'rgba(15, 15, 15, 0.9)',
    accent: '#1a1a2e'
  },
  animations: {
    defaultDuration: 0.3,
    fastDuration: 0.15,
    slowDuration: 0.6
  }
}