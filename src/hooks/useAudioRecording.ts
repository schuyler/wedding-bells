import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseAudioVolume {
  currentVolume: number
  error?: Error
  initializeAnalysis: (mediaStream: MediaStream) => void
  stopAnalysis: () => void
}

export function useAudioVolume(): UseAudioVolume {
  const [currentVolume, setCurrentVolume] = useState(0)
  const [error, setError] = useState<Error>()

  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const animationFrame = useRef<number | null>(null)

  const stopAnalysis = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
    if (audioContext.current) {
      audioContext.current.close()
      audioContext.current = null
    }
    analyser.current = null
    setCurrentVolume(0)
  }, [])

  useEffect(() => {
    return () => stopAnalysis()
  }, [stopAnalysis])

  const initializeAnalysis = useCallback((mediaStream: MediaStream) => {
    try {
      // Create new audio context and analyzer
      audioContext.current = new AudioContext()
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 2048 // For detailed analysis

      // Connect stream to analyzer
      const source = audioContext.current.createMediaStreamSource(mediaStream)
      source.connect(analyser.current)

      const dataArray = new Uint8Array(analyser.current.frequencyBinCount)

      // Start volume analysis loop
      const updateVolume = () => {
        if (!analyser.current) return

        analyser.current.getByteTimeDomainData(dataArray)
        
        // Calculate RMS volume
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const amplitude = (dataArray[i] - 128) / 128
          sum += amplitude * amplitude
        }
        const rms = Math.sqrt(sum / dataArray.length)
        setCurrentVolume(rms)

        animationFrame.current = requestAnimationFrame(updateVolume)
      }

      updateVolume()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize volume analysis'))
      stopAnalysis()
    }
  }, [stopAnalysis])

  return {
    currentVolume,
    error,
    initializeAnalysis,
    stopAnalysis
  }
}
