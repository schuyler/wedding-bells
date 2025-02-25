import { useEffect, useState } from 'react'
import { BrowserCompatibility } from '../types'

interface BrowserCheckProps {
  onCompatibilityChange: (compatibility: BrowserCompatibility) => void
}

export function BrowserCheck({ onCompatibilityChange }: BrowserCheckProps) {
  const [compatibility, setCompatibility] = useState<BrowserCompatibility>({
    hasAudioSupport: false,
    hasMicrophonePermission: false,
    hasWaveSurferSupport: false
  })

  useEffect(() => {
    const checkCompatibility = async () => {
      // Check for Web Audio API support
      const hasAudioContext = typeof window !== 'undefined' && 
        (window.AudioContext || (window as any).webkitAudioContext)

      // Check for MediaRecorder support
      const hasMediaRecorder = typeof window !== 'undefined' && 
        'MediaRecorder' in window
      
      // Check for AudioWorklet support (needed for Wavesurfer.js)
      const hasAudioWorklet = typeof window !== 'undefined' && 
        'AudioWorklet' in (window.AudioContext || (window as any).webkitAudioContext).prototype

      const audioSupport = hasAudioContext && hasMediaRecorder && hasAudioWorklet

      // Check for existing microphone permission
      let micPermission = false
      try {
        const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        micPermission = permissions.state === 'granted'
      } catch {
        // Permissions API not supported or other error
        micPermission = false
      }

      const newCompatibility: BrowserCompatibility = {
        hasAudioSupport: audioSupport,
        hasMicrophonePermission: micPermission,
        hasWaveSurferSupport: hasAudioContext && hasAudioWorklet
      }

      setCompatibility(newCompatibility)
      onCompatibilityChange(newCompatibility)
    }

    checkCompatibility()
  }, [onCompatibilityChange])

  if (!compatibility.hasAudioSupport) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <h3 className="text-lg font-medium text-red-800">
          Browser Not Supported
        </h3>
        <p className="mt-2 text-sm text-red-700">
          Your browser does not support audio recording. Please try using a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    )
  }

  if (!compatibility.hasWaveSurferSupport) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
        <h3 className="text-lg font-medium text-yellow-800">
          Limited Browser Support
        </h3>
        <p className="mt-2 text-sm text-yellow-700">
          Your browser has limited support for audio visualization. The recording will work, but you may not see the audio waveform.
        </p>
      </div>
    )
  }

  return null
}
