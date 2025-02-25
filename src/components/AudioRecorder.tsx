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
  const waveformRef = useRef<WaveSurferControls>(null)
  const [error, setError] = useState<Error | null>(null)
  const { currentVolume, error: volumeError, initializeAnalysis, stopAnalysis } = useAudioVolume()

  // Handle recording state changes
  const handleRecordingStart = useCallback(async () => {
    setIsRecording(true)
    setIsPaused(false)

    // Get access to the microphone stream for volume analysis
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
      const error = err instanceof Error 
        ? err 
        : new Error('Failed to access microphone. Please check your permissions and try again.')
      setError(error)
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
    // Re-initialize volume analysis
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
      const error = err instanceof Error 
        ? err 
        : new Error('Failed to resume recording. Please check your microphone and try again.')
      setError(error)
      setIsPaused(true)
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
                onClick={() => {
                  waveformRef.current?.startRecording()
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
