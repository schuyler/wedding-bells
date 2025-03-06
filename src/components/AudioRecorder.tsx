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
  // Duration is tracked by CountdownTimer component
  
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
    stopAnalysis,
    debugValues 
  } = useAudioVolume()

  // Sync volume analysis error with component error state
  useEffect(() => {
    if (volumeError) {
      setError(volumeError)
    }
  }, [volumeError])

  // Initialize audio analysis on component mount
  useEffect(() => {
    const initializeVolumeAnalysis = async () => {
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
      } catch (err) {
        console.log('Error initializing volume analysis:', err)
      }
    }
    
    initializeVolumeAnalysis()
    
    // Cleanup resources on unmount
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis, initializeAnalysis])

  /**
   * Handles state changes during recording
   */
  const handleStateChange = useCallback(({ 
    isRecording, 
    isPaused 
  }: { 
    isRecording: boolean; 
    isPaused: boolean; 
    duration: number 
  }) => {
    setIsRecording(isRecording)
    setIsPaused(isPaused)
    
    // Keep volume indicator active at all times - no need to stop analysis
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
      // Stop audio analysis if permission is denied
      stopAnalysis()
    }
  }, [stopAnalysis])

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
      // Start recording with AudioRecorderControl
      // We don't need to initialize the volume analysis again since it's done on component mount
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
  }, [handleError, handlePermissionChange])

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

        <div className="flex flex-col items-center space-y-4 md:space-y-2">
          {/* Volume and Timer Container - Column on mobile, row on md+ screens */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center space-y-4 md:space-y-0">
            {/* Volume Analysis Container */}
            <div className="w-full md:w-auto">
              {/* Volume Level Indicator */}
              <VolumeIndicator 
                volume={isPaused ? 0 : currentVolume}
                size="lg"
                className="w-full max-w-xs mx-auto"
              />

              {/* Debug Values Display (disabled but preserved) */}
              {false && import.meta.env.DEV && (
                <div className="bg-gray-100 p-2 rounded-md text-xs font-mono w-full max-w-xs mx-auto">
                  <div>Volume Analysis Debug:</div>
                  <div>Raw RMS: {debugValues.rawRms.toFixed(6)}</div>
                  <div>dB Value: {debugValues.dbValue.toFixed(2)} dB</div>
                  <div>Normalized Volume: {debugValues.normalizedVolume.toFixed(4)}</div>
                  <div>Range: {debugValues.minDb}dB to {debugValues.maxDb}dB</div>
                </div>
              )}
            </div>

            {/* Recording Timer - Always visible but only running when recording */}
            <div className="mx-auto md:mx-0 md:ml-4">
              <CountdownTimer
                duration={MAX_DURATION}
                running={isRecording && !isPaused}
                onComplete={handleTimerComplete}
              />
            </div>
          </div>

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
                      // Resume recording (volume analysis continues to run)
                      audioRecorderControlRef.current?.resumeRecording()
                    } else {
                      // Pause recording (volume analysis continues to run)
                      audioRecorderControlRef.current?.pauseRecording()
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
