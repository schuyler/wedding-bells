import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactElement, type RefObject } from 'react'
import WaveSurfer from 'wavesurfer.js'
import Record from 'wavesurfer.js/dist/plugins/record.esm.js'

interface WaveformVisualizerProps {
  onRecordingComplete?: (blob: Blob) => void
  onRecordingStart?: () => void
  onRecordingPause?: () => void
  onRecordingResume?: () => void
  onPlaybackComplete?: () => void
  className?: string
  maxDuration?: number // in seconds, default 900 (15 minutes)
}

export interface WaveSurferControls {
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
}

export type WaveformVisualizerRef = RefObject<WaveSurferControls>

export const WaveformVisualizer = forwardRef<WaveSurferControls, WaveformVisualizerProps>(({
  onRecordingComplete,
  onRecordingStart,
  onRecordingPause,
  onRecordingResume,
  onPlaybackComplete,
  className = '',
  maxDuration = 900
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const recordPlugin = useRef<ReturnType<typeof Record.create> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob>()

  // Initialize WaveSurfer with Record plugin
  useEffect(() => {
    if (!containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#3B82F6', // blue-500
      progressColor: '#1E40AF', // blue-800
      cursorColor: '#1E40AF',
      cursorWidth: 2,
      height: 128,
      normalize: true,
      dragToSeek: !isRecording,
      autoScroll: true,
      hideScrollbar: true,
      minPxPerSec: 100, // Good detail level for voice
      autoCenter: true,
      fillParent: true
    })

    // Initialize record plugin
    recordPlugin.current = ws.registerPlugin(Record.create({
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000, // Fixed bitrate for consistent quality
      renderRecordedAudio: true, // Show recorded audio waveform
      scrollingWaveform: true, // Show scrolling waveform while recording
      scrollingWaveformWindow: 5, // Show last 5 seconds
      continuousWaveform: true, // Accumulate waveform data while recording
      mediaRecorderTimeslice: 100 // Emit data every 100ms for smooth visualization
    }))

    // Set up record plugin event handlers
    if (recordPlugin.current) {
      recordPlugin.current.on('record-start', () => {
        setIsRecording(true)
        setIsPaused(false)
        onRecordingStart?.()
      })

      recordPlugin.current.on('record-end', (blob: Blob) => {
        setIsRecording(false)
        setIsPaused(false)
        setAudioBlob(blob)
        // Load the recorded audio for immediate playback
        if (wavesurfer.current) {
          wavesurfer.current.loadBlob(blob)
        }
        onRecordingComplete?.(blob)
      })

      // Monitor recording progress
      recordPlugin.current.on('record-progress', (duration: number) => {
        // Optional: You could add a duration state and callback if needed
        if (duration >= maxDuration) {
          stopRecording()
        }
      })

      recordPlugin.current.on('record-pause', () => {
        setIsPaused(true)
        onRecordingPause?.()
      })

      recordPlugin.current.on('record-resume', () => {
        setIsPaused(false)
        onRecordingResume?.()
      })
    }

    wavesurfer.current = ws

    ws.on('finish', () => {
      setIsPlaying(false)
      onPlaybackComplete?.()
    })

    return () => {
      ws.destroy()
      wavesurfer.current = null
      recordPlugin.current = null
    }
  }, [maxDuration, onPlaybackComplete, onRecordingComplete, onRecordingPause, onRecordingResume, onRecordingStart])

  // Recording control methods
  const startRecording = async () => {
    try {
      if (recordPlugin.current && !isRecording) {
        await recordPlugin.current.startRecording()
      }
    } catch (err) {
      console.error('Failed to start recording:', err)
      throw err
    }
  }

  const stopRecording = async () => {
    try {
      if (recordPlugin.current && isRecording) {
        await recordPlugin.current.stopRecording()
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
      throw err
    }
  }

  const pauseRecording = () => {
    try {
      if (recordPlugin.current && isRecording && !isPaused) {
        recordPlugin.current.pauseRecording()
      }
    } catch (err) {
      console.error('Failed to pause recording:', err)
      throw err
    }
  }

  const resumeRecording = () => {
    try {
      if (recordPlugin.current && isRecording && isPaused) {
        recordPlugin.current.resumeRecording()
      }
    } catch (err) {
      console.error('Failed to resume recording:', err)
      throw err
    }
  }

  // Playback control methods
  const togglePlayback = () => {
    if (!wavesurfer.current || isRecording) return

    if (isPlaying) {
      wavesurfer.current.pause()
    } else {
      wavesurfer.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Expose recording controls to parent via ref
  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      if (recordPlugin.current && !isRecording) {
        await recordPlugin.current.startRecording()
      }
    },
    stopRecording: () => {
      if (recordPlugin.current && isRecording) {
        recordPlugin.current.stopRecording()
      }
    },
    pauseRecording: () => {
      if (recordPlugin.current && isRecording && !isPaused) {
        recordPlugin.current.pauseRecording()
      }
    },
    resumeRecording: () => {
      if (recordPlugin.current && isRecording && isPaused) {
        recordPlugin.current.resumeRecording()
      }
    }
  }), [isRecording, isPaused])

  return (
    <div className={`relative ${className}`}>
      {/* Waveform container */}
      <div 
        ref={containerRef}
        className={`
          h-32
          bg-gray-50 
          rounded-lg 
          border-2 
          ${isRecording ? 'border-red-200' : 'border-gray-200'} 
          touch-none
          select-none
          transition-colors
          duration-200
          ${!isRecording && audioBlob ? 'cursor-pointer' : ''}
        `}
        onClick={togglePlayback}
        role="button"
        tabIndex={!isRecording && audioBlob ? 0 : -1}
        aria-label={
          isRecording 
            ? 'Audio waveform visualization'
            : audioBlob
              ? isPlaying ? 'Pause audio' : 'Play audio'
              : 'Waveform placeholder'
        }
      />

      {/* Playback controls */}
      {!isRecording && audioBlob && (
        <button
          onClick={togglePlayback}
          className="
            absolute 
            top-1/2 
            left-1/2 
            transform 
            -translate-x-1/2 
            -translate-y-1/2
            bg-blue-500
            hover:bg-blue-600
            text-white
            rounded-full
            w-12
            h-12
            flex
            items-center
            justify-center
            transition-colors
            duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-2
          "
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="5" width="3" height="10" />
              <rect x="11" y="5" width="3" height="10" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>
      )}

      {/* Status text for empty state */}
      {!isRecording && !audioBlob && (
        <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500">
          Ready to record
        </p>
      )}
    </div>
  )
})
