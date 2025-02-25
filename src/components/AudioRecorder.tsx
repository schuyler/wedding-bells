import { useState } from 'react'
import { CountdownTimer } from './CountdownTimer'
import { VolumeIndicator } from './VolumeIndicator'
import { WaveformVisualizer } from './WaveformVisualizer'

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onCancel: () => void
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  // Temporary mock volume state - will be replaced in Phase 3
  const [mockVolume, setMockVolume] = useState(0)

  // Mock volume animation for testing UI
  const startMockVolume = () => {
    const interval = setInterval(() => {
      setMockVolume(Math.random() * 0.8 + 0.2) // Random volume between 0.2 and 1
    }, 100)
    return () => clearInterval(interval)
  }

  const handleStartRecording = () => {
    setIsRecording(true)
    const cleanup = startMockVolume()
    // Will implement actual recording in Phase 3
    return cleanup
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setMockVolume(0)
    // Will implement actual recording completion in Phase 3
    onRecordingComplete(new Blob())
  }

  const handlePauseRecording = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      startMockVolume()
    } else {
      setMockVolume(0)
    }
  }

  return (
    <div className="space-y-6">
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
        {/* Waveform Visualization Placeholder */}
        <div className="w-full">
          <WaveformVisualizer
            isRecording={isRecording && !isPaused}
            audioBlob={undefined}
          />
        </div>

        {/* Volume Level */}
        <VolumeIndicator 
          volume={isPaused ? 0 : mockVolume}
          size="md"
          className="mb-4"
        />

        {/* Recording Timer */}
        {isRecording && (
          <CountdownTimer
            duration={15 * 60} // 15 minutes
            running={!isPaused}
            onComplete={handleStopRecording}
          />
        )}

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <>
              <button
                onClick={handleStartRecording}
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
                onClick={handlePauseRecording}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleStopRecording}
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
