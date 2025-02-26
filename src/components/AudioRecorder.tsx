import { useCallback, useEffect, useRef, useState } from 'react'
import { CountdownTimer } from './CountdownTimer'
import { VolumeIndicator } from './VolumeIndicator'
import { WaveformVisualizer, type WaveSurferControls } from './WaveformVisualizer'
import { useAudioVolume } from '../hooks/useAudioRecording'
import { ErrorModal } from './ErrorModal'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  // Following the standard Web Audio API pattern:
  // 1. Don't pre-check permissions - wait for user interaction
  // 2. Use browser's native permission prompt when user initiates recording
  // 3. Handle permission results in the recording flow
  // This matches common audio app patterns and MDN examples
  const waveformRef = useRef<WaveSurferControls>(null)
  const [error, setError] = useState<Error | null>(null)
  const { currentVolume, error: volumeError, initializeAnalysis, stopAnalysis } = useAudioVolume()
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  // Request permissions only when user starts recording
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

  // Handle recording state changes
  const handleRecordingStart = useCallback(async () => {
    // We already have permission if we get here
    setIsRecording(true)
    setIsPaused(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })
      initializeAnalysis(stream)
    } catch (err) {
      // This should rarely happen since we already checked permissions
      // If permissions were revoked mid-recording, show denied state
      // Otherwise treat as a technical error
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

  const handleRecordingStop = useCallback((blob: Blob) => {
    setIsRecording(false)
    setIsPaused(false)
    stopAnalysis()
    onRecordingComplete(blob)
  }, [onRecordingComplete, stopAnalysis])

  const handleRecordingPause = useCallback(() => {
    setIsPaused(true)
    stopAnalysis()
  }, [stopAnalysis])

  const handleRecordingResume = useCallback(async () => {
    setIsPaused(false)
    // When resuming, we know we already had permission, so focus error on hardware/system issues
    try {
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

  // Clean up on unmount
  useEffect(() => {
    return () => stopAnalysis()
  }, [stopAnalysis])

  // Handle errors
  useEffect(() => {
    if (volumeError) {
      setError(volumeError)
    }
  }, [volumeError])

  // Early return for permission denied state to prevent layout issues
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

  // Only render recording UI if permissions are not denied
  return (
    <div className="space-y-6">
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
        {/* Waveform Visualization */}
        <WaveformVisualizer
          ref={waveformRef}
          onRecordingComplete={handleRecordingStop}
          onRecordingStart={handleRecordingStart}
          onRecordingPause={handleRecordingPause}
          onRecordingResume={handleRecordingResume}
          maxDuration={15 * 60} // 15 minutes
          className="w-full"
        />

        {/* Volume Level */}
        <VolumeIndicator 
          volume={isPaused ? 0 : currentVolume}
          size="md"
          className="mb-4"
        />

        {/* Recording Timer */}
        {isRecording && (
          <CountdownTimer
            duration={15 * 60}
            running={!isPaused}
            onComplete={() => {
              waveformRef.current?.stopRecording()
            }}
          />
        )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
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
