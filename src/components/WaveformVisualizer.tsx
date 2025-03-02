import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type RefObject, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import Record from 'wavesurfer.js/dist/plugins/record.esm.js'

/**
 * Props interface for the WaveformVisualizer component.
 * 
 * Follows Architecture Pattern 3.1 ("Component Interface Standardization")
 * Enables consistent, predictable integration with parent components.
 * 
 * @property onRecordingComplete - Callback when recording ends, receives the audio blob
 * @property onRecordingStart - Callback when recording begins
 * @property onRecordingPause - Callback when recording is paused
 * @property onRecordingResume - Callback when recording resumes after pause
 * @property onPlaybackComplete - Callback when playback of recorded audio completes
 * @property className - Optional CSS class names to apply to the container
 * @property maxDuration - Maximum recording duration in seconds (default: 900 seconds/15 minutes)
 */
interface WaveformVisualizerProps {
  onRecordingComplete?: (blob: Blob) => void
  onRecordingStart?: () => void
  onRecordingPause?: () => void
  onRecordingResume?: () => void
  onPlaybackComplete?: () => void
  className?: string
  maxDuration?: number // in seconds, default 900 (15 minutes)
}

/**
 * External control interface for WaveSurfer recording functionality.
 * 
 * Designed according to Technical Specification 2.3 ("Component Control Interfaces")
 * Provides a clean API for parent components to control recording functionality
 * without exposing internal implementation details.
 * 
 * @property startRecording - Initiates audio recording
 * @property stopRecording - Ends current recording
 * @property pauseRecording - Temporarily suspends recording
 * @property resumeRecording - Continues recording after pause
 */
export interface WaveSurferControls {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
}

/**
 * Type definition for the forwarded ref to access WaveSurferControls.
 * Enables parent components to imperatively control recording state.
 */
export type WaveformVisualizerRef = RefObject<WaveSurferControls>

/**
 * Audio waveform visualization and recording component using WaveSurfer.js.
 * 
 * Architecture Compliance:
 * - Implements Technical Specification 3.2.1 ("Real-time Audio Visualization")
 * - Follows Component Pattern 2.4 ("Ref-based Imperative Controls")
 * - Adheres to Accessibility Guideline 4.1 ("Audio Component A11y Requirements")
 * 
 * Visualization & Recording Chain:
 * 1. WaveSurfer creates canvas-based visualization
 * 2. Record plugin handles MediaRecorder integration
 * 3. Audio data streamed to waveform in real-time
 * 4. Recording state managed via ref-based API
 * 
 * Design Tradeoffs:
 * - Uses forwardRef pattern for imperative API access
 * - WaveSurfer handles both visualization and recording to ensure synchronization
 * - Configures scrolling window of 3 seconds for performance optimization
 * - Disables normalization to prevent distracting amplitude changes
 * 
 * Technical Debt:
 * ! Default mimetype (audio/webm) may need to change to audio/wav for final implementation
 * ! Currently setting fixed bitrate (128kbps) - should be configurable in future
 * ! Playback controls minimal and could be enhanced with volume/scrubbing
 */
export const WaveformVisualizer = forwardRef<WaveSurferControls, WaveformVisualizerProps>(({
  onRecordingComplete,
  onRecordingStart,
  onRecordingPause,
  onRecordingResume,
  onPlaybackComplete,
  className = '',
  maxDuration = 900
}, ref) => {
  // Core references and state
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const recordPlugin = useRef<ReturnType<typeof Record.create> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob>()

  /**
   * Initialize WaveSurfer with Record plugin
   * 
   * Implementation Notes:
   * - Creates new WaveSurfer instance when component mounts
   * - Configures visualization parameters optimized for real-time display
   * - Sets up Record plugin with specific timeslice for frequent updates
   * - Establishes event handlers for recording state changes
   * - Implements monitoring for recording duration
   * - Sets up proper cleanup on unmount
   */
  const stopRecording = useCallback(async () => {
    try {
      if (recordPlugin.current && isRecording) {
        await recordPlugin.current.stopRecording()
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
      console.log("Error caught in stopRecording:", err);
      throw err
    }
  }, [isRecording])

  useEffect(() => {
    if (!containerRef.current) return

    // WaveSurfer core configuration - optimized for real-time visualization
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#3B82F6', // blue-500
      progressColor: '#1E40AF', // blue-800
      cursorColor: '#1E40AF',
      cursorWidth: 2,
      height: 128,
      normalize: false, // Disable normalization to prevent distracting amplitude scaling
      dragToSeek: !isRecording,
      autoScroll: true, // Ensure waveform scrolls smoothly
      hideScrollbar: true,
      minPxPerSec: 50, // Balanced zoom level for real-time display
      autoCenter: true,
      fillParent: true,
      interact: false // Disable user interaction during recording
    })

    // Record plugin configuration - balances visualization quality with performance
    recordPlugin.current = ws.registerPlugin(Record.create({
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000, // Fixed bitrate for consistent quality
      renderRecordedAudio: true, // Show recorded audio waveform
      scrollingWaveform: true, // Show scrolling waveform while recording
      scrollingWaveformWindow: 3, // Show last 3 seconds for faster updates
      continuousWaveform: false, // Disable continuous mode to prevent slowdown
      mediaRecorderTimeslice: 50 // Frequent updates for smooth visualization
    }))

    // Record plugin event handlers - maintain state consistency and trigger callbacks
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

      // Duration monitoring - enforce maximum recording time
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

    // Playback completion handler
    ws.on('finish', () => {
      setIsPlaying(false)
      onPlaybackComplete?.()
    })

    // Cleanup function to prevent memory leaks
    return () => {
      ws.destroy()
      wavesurfer.current = null
      recordPlugin.current = null
    }
  }, [maxDuration, onPlaybackComplete, onRecordingComplete, onRecordingPause, onRecordingResume, onRecordingStart, isRecording, stopRecording])

  /**
   * Initiates audio recording
   * 
   * Following Error Management Protocol 2.1:
   * - Wraps MediaRecorder operations in try/catch
   * - Logs failures for debugging
   * - Rethrows errors for parent component handling
   */
  /**
   * Toggles playback of recorded audio
   * 
   * Technical Notes:
   * - Only functional when recording is complete
   * - Updates playback state for UI consistency
   * - Leverages WaveSurfer's built-in playback controls
   */
  const togglePlayback = () => {
    if (!wavesurfer.current || isRecording) return

    if (isPlaying) {
      wavesurfer.current.pause()
    } else {
      wavesurfer.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  /**
   * Exposes recording control methods to parent components via ref
   * 
   * Implementation follows Component Pattern 2.4:
   * - Uses React's useImperativeHandle for ref forwarding
   * - Provides clean API abstraction over internal implementation
   * - Ensures state-aware method behavior
   * - Updates dependencies to prevent stale closures
   */
  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      if (recordPlugin.current && !isRecording) {
        await recordPlugin.current.startRecording()
      }
    },
    stopRecording: async () => {
      return stopRecording()
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
  }), [isRecording, isPaused, stopRecording])

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
