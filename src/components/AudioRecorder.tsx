import { useCallback, useEffect, useRef, useState } from 'react'
import { CountdownTimer } from './CountdownTimer'
import { VolumeIndicator } from './VolumeIndicator'
import { AudioRecorderControl, AudioRecorderControls } from './AudioRecorderControl'
import { ErrorModal } from './ErrorModal'
import { useAudioVolume } from '../hooks/useAudioRecording'

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
 * Main audio recording component with integrated volume indication and controls.
 * 
 * Orchestrates the recording experience using AudioRecorderControl and specialized components.
 * 
 * User flow:
 * 1. Initial state shows "Start Recording" button
 * 2. When clicked, requests microphone permissions
 * 3. If granted, activates recording
 * 4. During recording, displays volume indicator and countdown timer
 * 5. Provides pause/resume/finish controls
 * 6. On completion, passes audio data to parent via onRecordingComplete
 */
export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  // Recording state management
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  
  // Error handling state
  const [error, setError] = useState<Error | null>(null)
  
  // Permission handling state
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  // References
  const audioRecorderControlRef = useRef<AudioRecorderControls>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Maximum recording duration (15 minutes)
  const MAX_DURATION = 15 * 60

  // Volume analysis hook
  const { 
    currentVolume, 
    error: volumeError, 
    initializeAnalysis, 
    stopAnalysis 
  } = useAudioVolume()

  // Sync volume analysis error with component error state
  useEffect(() => {
    if (volumeError) {
      setError(volumeError)
    }
  }, [volumeError])

  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis])

  /**
   * Handles state changes during recording
   */
  const handleStateChange = useCallback(({ 
    isRecording, 
    isPaused, 
    duration 
  }: { 
    isRecording: boolean; 
    isPaused: boolean; 
    duration: number 
  }) => {
    setIsRecording(isRecording)
    setIsPaused(isPaused)
    setRecordingDuration(duration)

    // Stop volume analysis when recording stops or pauses
    if (!isRecording || isPaused) {
      stopAnalysis()
    }
  }, [stopAnalysis])

  /**
   * Handles recording completion
   */
  const handleRecordingComplete = useCallback((blob: Blob) => {
    stopAnalysis()
    onRecordingComplete(blob)
  }, [onRecordingComplete, stopAnalysis])

  /**
   * Handles permission changes
   */
  const handlePermissionChange = useCallback((hasPermission: boolean | null) => {
    // Set permission denied state when permission is explicitly denied
    if (hasPermission === false) {
      setIsPermissionDenied(true)
      // Clear any existing error to ensure permission denied UI is shown
      setError(null)
    }
  }, [])

  /**
   * Handles errors from the AudioRecorderControl
   */
  const handleError = useCallback((err: Error) => {
    setError(err)
    stopAnalysis()
  }, [stopAnalysis])

  /**
   * Handles retry action from error modal
   */
  const handleRetry = useCallback(() => {
    setError(null)
    
    if (isRecording) {
      if (isPaused) {
        // Try to resume recording
        audioRecorderControlRef.current?.resumeRecording()
      } else {
        // We're in an error state while recording is active
        // Stop current recording and start fresh
        audioRecorderControlRef.current?.stopRecording()
        setTimeout(() => {
          audioRecorderControlRef.current?.startRecording()
        }, 100)
      }
    } else {
      // Try to start recording again
      audioRecorderControlRef.current?.startRecording()
    }
  }, [isRecording, isPaused])

  /**
   * Starts the recording process
   */
  const startRecording = useCallback(async () => {
    try {
      // Get media stream for volume analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })
      
      // Store stream reference for cleanup
      mediaStreamRef.current = stream
      
      // Initialize volume analysis with the stream
      initializeAnalysis(stream)
      
      // Start recording
      await audioRecorderControlRef.current?.startRecording()
    } catch (err) {
      console.log('Error caught in startRecording:', err, 'Error name:', err instanceof Error ? err.name : 'Not an Error object');
      
      // Check if this is a browser permission error - ONLY NotAllowedError should trigger permission denied UI
      if (err instanceof Error && err.name === 'NotAllowedError') {
        // Handle permission errors by setting permission denied state
        handlePermissionChange(false)
      } else if (err instanceof Error && err.message === 'Permission required') {
        // This is a permission error from AudioRecorderControl, not a browser permission error
        // Show error modal instead of permission denied UI
        handleError(err)
      } else if (err instanceof Error) {
        // Handle all other errors by showing the error modal
        handleError(err)
      } else {
        // Handle non-Error objects with a specific message
        handleError(new Error('Failed to access microphone. Please check your settings and try again.'))
      }
    }
  }, [initializeAnalysis, handleError, handlePermissionChange])

  /**
   * Handles countdown timer completion
   */
  const handleTimerComplete = useCallback(() => {
    if (isRecording && audioRecorderControlRef.current) {
      audioRecorderControlRef.current.stopRecording()
        .then(blob => {
          if (blob) handleRecordingComplete(blob)
        })
        .catch(err => handleError(err instanceof Error ? err : new Error('Failed to stop recording')))
    }
  }, [isRecording, handleRecordingComplete, handleError])

  // Permission denied UI
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

  return (
    <AudioRecorderControl
      ref={audioRecorderControlRef}
      onStateChange={handleStateChange}
      onPermissionChange={handlePermissionChange}
      onError={handleError}
      onRecordingData={handleRecordingComplete}
      maxDuration={MAX_DURATION}
    >
      <div className="space-y-6">
        {/* Error handling modal */}
        <ErrorModal
          isOpen={error !== null}
          onClose={() => setError(null)}
          title="Recording Error"
          description={error?.message || 'An unknown error occurred'}
          action={{
            label: 'Try Again',
            onClick: handleRetry
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
          {/* Volume Level Indicator */}
          <VolumeIndicator 
            volume={isPaused ? 0 : currentVolume}
            size="lg"
            className="mb-4 w-full max-w-md"
          />

          {/* Recording Timer */}
          {isRecording && (
            <CountdownTimer
              duration={MAX_DURATION}
              running={!isPaused}
              onComplete={handleTimerComplete}
            />
          )}

          {/* Control buttons */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              // Initial state: Start Recording + Cancel buttons
              <>
                <button
                  onClick={startRecording}
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
                      // Resume recording and volume analysis
                      audioRecorderControlRef.current?.resumeRecording()
                      if (mediaStreamRef.current) {
                        initializeAnalysis(mediaStreamRef.current)
                      }
                    } else {
                      // Pause recording and volume analysis
                      audioRecorderControlRef.current?.pauseRecording()
                      stopAnalysis()
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={async () => {
                    const blob = await audioRecorderControlRef.current?.stopRecording()
                    if (blob) handleRecordingComplete(blob)
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
    </AudioRecorderControl>
  )
}
