import { useCallback, useEffect, useRef, useState } from 'react'
import { CountdownTimer } from './CountdownTimer'
import { VolumeIndicator } from './VolumeIndicator'
import { WaveformVisualizer, type WaveSurferControls } from './WaveformVisualizer'
import { useAudioVolume } from '../hooks/useAudioRecording'
import { ErrorModal } from './ErrorModal'

/**
 * Props interface for the AudioRecorder component.
 * 
 * Provides essential callbacks for core recording functionality.
 * 
 * @property onRecordingComplete - Called when recording is finished with resulting audio blob
 * @property onCancel - Called when user cancels recording process
 */
interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

/**
 * Main audio recording component with integrated visualization, volume indication, and controls.
 * 
 * This component orchestrates the overall recording experience by composing several
 * specialized components (WaveformVisualizer, VolumeIndicator, CountdownTimer) and
 * managing recording state, permissions, and error handling.
 * 
 * User flow:
 * 1. Initial state shows "Start Recording" button
 * 2. When clicked, requests microphone permissions
 * 3. If granted, activates WaveformVisualizer for recording
 * 4. During recording, displays volume indicator and countdown timer
 * 5. Provides pause/resume/finish controls
 * 6. On completion, passes audio data to parent via onRecordingComplete
 * 
 * Implementation details:
 * - Uses Web Audio API for volume analysis via useAudioVolume hook
 * - Controls WaveformVisualizer through refs (imperative approach)
 * - Manages local recording state that synchronizes with WaveformVisualizer events
 * - Follows Mozilla's recommended pattern for permissions handling
 * 
 * Opportunities for improvement:
 * - State management is duplicated between this component and WaveformVisualizer,
 *   which could lead to synchronization issues. Consider using a shared state
 *   approach or centralizing recording state in one location.
 * - Error handling could be more granular with specific recovery paths for
 *   different types of errors beyond permission issues.
 * - Permission denied UI could provide more help on how to enable permissions
 *   in different browsers.
 */
export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  // Local recording state (duplicates some state in WaveformVisualizer)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Reference to WaveformVisualizer for imperative control
  const waveformRef = useRef<WaveSurferControls>(null)
  
  // Error handling state
  const [error, setError] = useState<Error | null>(null)
  
  // Volume analysis hook
  const { currentVolume, error: volumeError, initializeAnalysis, stopAnalysis } = useAudioVolume({
    minDecibels: -40, // Below speaking level
    maxDecibels: -10  // Above normal speaking level
  })
  
  // Permission handling state
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  /**
   * Requests microphone access before starting recording.
   * 
   * Following Mozilla's recommended pattern:
   * - Only requests permissions after explicit user action
   * - Uses browser's native permission UI
   * - Tests permission by requesting and immediately releasing stream
   * 
   * @returns Promise resolving to boolean indicating if permission was granted
   */
  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })
      // Stop the stream immediately - we'll request it again when recording starts
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (err) {
      // If it's a permissions error, show the denied state
      // Otherwise, show it as a regular error that can be retried
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setIsPermissionDenied(true)
      } else {
        const error = err instanceof Error
          ? err
          : new Error('Failed to access microphone. Please check your settings and try again.')
        setError(error)
      }
      return false
    }
  }

  /**
   * Handles recording start event from WaveformVisualizer.
   * 
   * Updates local state and initializes volume analysis with a fresh
   * MediaStream instance for the current recording session.
   */
  const handleRecordingStart = useCallback(async () => {
    // Update local state to match WaveformVisualizer
    setIsRecording(true)
    setIsPaused(false)

    try {
      // Get fresh MediaStream for volume analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })
      initializeAnalysis(stream)
    } catch (err) {
      // Handle permission revocation or device errors
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setIsPermissionDenied(true)
      } else {
        const error = err instanceof Error
          ? err
          : new Error('Failed to start recording. Please check your microphone and try again.')
        setError(error)
      }
      setIsRecording(false)
    }
  }, [initializeAnalysis])

  /**
   * Handles recording stop event from WaveformVisualizer.
   * 
   * Cleans up resources, updates local state, and passes the
   * final audio blob to the parent component.
   */
  const handleRecordingStop = useCallback((blob: Blob) => {
    setIsRecording(false)
    setIsPaused(false)
    stopAnalysis()
    onRecordingComplete(blob)
  }, [onRecordingComplete, stopAnalysis])

  /**
   * Handles recording pause event from WaveformVisualizer.
   * 
   * Updates local state and stops volume analysis to conserve resources
   * while recording is paused.
   */
  const handleRecordingPause = useCallback(() => {
    setIsPaused(true)
    stopAnalysis()
  }, [stopAnalysis])

  /**
   * Handles recording resume event from WaveformVisualizer.
   * 
   * Restarts volume analysis with a fresh MediaStream and handles
   * any permission or device errors that might occur.
   */
  const handleRecordingResume = useCallback(async () => {
    setIsPaused(false)
    
    try {
      // Get fresh MediaStream for continued analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })
      initializeAnalysis(stream)
    } catch (err) {
      // Check if permissions were revoked while paused
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setIsPermissionDenied(true)
      } else {
        const error = err instanceof Error
          ? err
          : new Error('Unable to access microphone. Please check if another application is using it.')
        setError(error)
        setIsPaused(true)
      }
    }
  }, [initializeAnalysis])

  /**
   * Cleanup effect for audio resources on component unmount.
   * 
   * Ensures all audio analysis resources are properly released when
   * the component is unmounted.
   */
  useEffect(() => {
    return () => stopAnalysis()
  }, [stopAnalysis])

  /**
   * Effect to synchronize volume analysis errors with component error state.
   * 
   * Forwards errors from the useAudioVolume hook to the component's
   * error handling system.
   */
  useEffect(() => {
    if (volumeError) {
      setError(volumeError)
    }
  }, [volumeError])

  /**
   * Special UI for permission denied state.
   * 
   * Shows a focused error message when microphone access is explicitly
   * denied, since the app cannot function without audio input.
   */
  if (isPermissionDenied) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <h3 className="text-lg font-medium text-red-800">
            Microphone Access Denied
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Microphone access is required for audio recording. Please check your
            browser settings to allow microphone access for this site.
          </p>
          <div className="mt-4">
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main component rendering - only if permissions not explicitly denied
  return (
    <div className="space-y-6">
      {/* Error handling modal for technical issues */}
      <ErrorModal
        isOpen={error !== null}
        onClose={() => setError(null)}
        title="Recording Error"
        description={error ? error.message : 'An unknown error occurred while recording audio.'}
        action={{
          label: 'Try Again',
          onClick: () => {
            setError(null)
            if (isPaused) {
              handleRecordingResume()
            } else if (!isRecording) {
              handleRecordingStart()
            }
          }
        }}
      />

      {/* Recording status header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {isRecording ? 'Recording in Progress' : 'Ready to Record'}
        </h3>
        <p className="text-gray-600">
          {isRecording
            ? isPaused
              ? 'Recording paused'
              : 'Speak clearly into your microphone'
            : 'Click start when you are ready'}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Waveform Visualization - Primary recording interface */}
        <WaveformVisualizer
          ref={waveformRef}
          onRecordingComplete={handleRecordingStop}
          onRecordingStart={handleRecordingStart}
          onRecordingPause={handleRecordingPause}
          onRecordingResume={handleRecordingResume}
          maxDuration={15 * 60} // 15 minutes
          className="w-full"
        />

        {/* Volume Level Indicator - Real-time feedback */}
        <VolumeIndicator 
          volume={isPaused ? 0 : currentVolume}
          size="md"
          className="mb-4"
        />

        {/* Recording Timer - Duration monitoring */}
        {isRecording && (
          <CountdownTimer
            duration={15 * 60}
            running={!isPaused}
            onComplete={() => {
              waveformRef.current?.stopRecording()
            }}
          />
        )}

      {/* Control buttons - State-dependent UI */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          // Initial state: Start Recording + Cancel buttons
          <>
            <button
              onClick={async () => {
                // Request permissions when user clicks to start recording
                const hasPermission = await requestMicrophoneAccess()
                if (hasPermission) {
                  waveformRef.current?.startRecording()
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Start Recording
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
            // Recording state: Pause/Resume + Finish buttons
            <>
              <button
                onClick={() => {
                  if (isPaused) {
                    waveformRef.current?.resumeRecording()
                  } else {
                    waveformRef.current?.pauseRecording()
                  }
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => {
                  waveformRef.current?.stopRecording()
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Finish Recording
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}