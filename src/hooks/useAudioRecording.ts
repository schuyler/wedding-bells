import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Configuration parameters for audio volume analysis normalization.
 * 
 * Implements requirements from Architecture Document Section 4.2 ("Audio Analysis Parameters").
 * Default values align with typical human speech patterns observed in project requirements.
 * 
 * @property minDecibels - Baseline noise floor (quietest measurable level)
 * @property maxDecibels - Peak volume threshold (loudest measurable level)
 * 
 * @example
 * // Typical conversation ranges from -30dB (pause) to -10dB (normal speech)
 * { minDecibels: -30, maxDecibels: 0 }
 */
export interface VolumeConfig {
  minDecibels?: number
  maxDecibels?: number
  debug?: boolean
}

/**
 * Core controller interface for real-time audio volume analysis.
 * 
 * Designed according to Architecture Principle 2.1 ("Separation of Analysis and Recording Concerns").
 * Maintains strict isolation from audio capture logic to enable independent testing and reuse.
 * 
 * @property currentVolume - Normalized volume level (0-1 scale, clamped)
 * @property error - Runtime errors during analysis initialization
 * @method initializeAnalysis - Connects to media stream and starts analysis loop
 * @method stopAnalysis - Cleanly terminates audio resources and analysis
 */
export interface UseAudioVolume {
  currentVolume: number
  error?: Error
  initializeAnalysis: (mediaStream: MediaStream) => void
  stopAnalysis: () => void
  debugValues: {
    rawRms: number
    dbValue: number
    normalizedVolume: number
    smoothedVolume: number
    minDb: number
    maxDb: number
  }
}

/**
 * Real-time audio volume analysis hook using Web Audio API.
 * 
 * Architecture Compliance:
 * - Implements Technical Specification 4.3.2 ("Real-time Audio Processing")
 * - Follows Performance Guideline 6.1 ("Animation Frame Timing")
 * 
 * Signal Processing Chain:
 * 1. MediaStream -> AudioContext.createMediaStreamSource()
 * 2. AudioNode -> AnalyserNode (FFT Size 2048)
 * 3. Time Domain Data -> RMS Calculation -> dB Conversion
 * 4. Normalization -> Volume State Update
 * 
 * Design Tradeoffs:
 * - Uses requestAnimationFrame() for smooth UI updates (60fps cap)
 * - RMS calculation provides accurate power measurement vs peak detection
 * - Decibel normalization allows consistent volume scaling
 * 
 * Technical Debt:
 * ! Current defaults (-30dB to +10dB) deviate from architecture spec (-45dB to 0dB)
 * ! Missing exponential falloff filter (0.3s decay) per spec 4.3.5
 * 
 * @param config - Volume normalization parameters
 * @returns UseAudioVolume controller interface
 */
export function useAudioVolume(config: VolumeConfig = {}): UseAudioVolume {
  // Normalization range defaults based on observed audio levels
  const minDb = config.minDecibels ?? -50 // Extended to capture quieter sounds
  const maxDb = config.maxDecibels ?? -10  // Adjusted for typical speech levels
  
  // State management for volume and errors
  const [currentVolume, setCurrentVolume] = useState(0)
  const [error, setError] = useState<Error>()
  const [debugValues, setDebugValues] = useState({
    rawRms: 0,
    dbValue: 0,
    normalizedVolume: 0,
    smoothedVolume: 0,
    minDb,
    maxDb
  })

  // Web Audio API references
  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const animationFrame = useRef<number | null>(null)
  const lastVolumeRef = useRef(0)
  const lastUpdateRef = useRef(0)

  // Smoothing configuration
  const FALLOFF_DURATION = 500 // 500ms decay - slower falloff for smoother visualization
  const RISE_SPEED = 0.3 // Controls how quickly volume rises (0-1, lower = smoother)
  const FALLOFF_FACTOR = Math.exp(Math.log(0.001) / FALLOFF_DURATION) // Decay to 0.1% in FALLOFF_DURATION

  /**
   * Clean shutdown procedure for audio resources
   * 
   * Follows Resource Management Protocol 3.2 ("Audio Context Lifecycle")
   * Ensures proper garbage collection and prevents memory leaks
   */
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
    // Reset debug values
    setDebugValues(prev => ({
      ...prev,
      rawRms: 0,
      dbValue: 0,
      normalizedVolume: 0
    }))
  }, [])

  // Automatic cleanup on component unmount
  useEffect(() => {
    return () => stopAnalysis()
  }, [stopAnalysis])

  /**
   * Initializes audio analysis pipeline
   * 
   * @param mediaStream - Media stream from getUserMedia()
   * 
   * Implementation Notes:
   * - Creates new AudioContext on each initialization
   * - Configures FFT size for optimal frequency resolution
   * - Uses byte time domain data for computational efficiency
   * - Implements safety wrapper for error boundary handling
   */
  const initializeAnalysis = useCallback((mediaStream: MediaStream) => {
    try {
      // Audio context creation (single instance per analysis session)
      audioContext.current = new AudioContext()
      
      // Analyser node configuration
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 2048 // 1024 frequency bins

      // Source node creation and routing
      const source = audioContext.current.createMediaStreamSource(mediaStream)
      source.connect(analyser.current)

      // Reusable buffer for audio data processing
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount)

      /**
       * Core volume analysis loop
       * 
       * Execution Flow:
       * 1. Capture current time domain data
       * 2. Calculate RMS power
       * 3. Convert to decibel scale
       * 4. Normalize to configurable range
       * 5. Schedule next frame update
       */
      const updateVolume = () => {
        if (!analyser.current) return

        // 1. Get raw time domain data
        analyser.current.getByteTimeDomainData(dataArray)
        
        // 2. Calculate Root Mean Square (RMS) power
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const amplitude = (dataArray[i] - 128) / 128 // Convert uint8 to [-1, 1]
          sum += amplitude * amplitude
        }
        const rms = Math.sqrt(sum / dataArray.length)

        // 3. Convert RMS to decibel scale
        const epsilon = 1e-10 // Prevent log10(0) undefined
        const db = 20 * Math.log10(rms + epsilon)

        // 4. Normalize to configured dB range
        const range = maxDb - minDb
        const normalizedVolume = Math.max(0, Math.min(1, (db - minDb) / range))
        
        // Apply exponential falloff
        const now = performance.now()
        const timeDelta = now - lastUpdateRef.current
        const decayMultiplier = Math.pow(FALLOFF_FACTOR, timeDelta)
        
        // Apply smoothing in both directions
        // For rising volumes: interpolate with RISE_SPEED factor
        // For falling volumes: apply exponential decay
        const smoothedVolume = normalizedVolume > lastVolumeRef.current
          ? lastVolumeRef.current + (normalizedVolume - lastVolumeRef.current) * RISE_SPEED
          : lastVolumeRef.current * decayMultiplier

        // Update state and refs
        setCurrentVolume(smoothedVolume)
        lastVolumeRef.current = smoothedVolume
        lastUpdateRef.current = now

        // Update debug values with both raw and smoothed values
        setDebugValues({
          rawRms: rms,
          dbValue: db,
          normalizedVolume,
          smoothedVolume,
          minDb,
          maxDb
        })

        // Debug logging (only if debug flag is set)
        if (config.debug) {
          console.log(`Audio Analysis: RMS=${rms.toFixed(6)}, dB=${db.toFixed(2)}, Volume=${normalizedVolume.toFixed(4)}`);
        }

        // 5. Continue analysis loop
        animationFrame.current = requestAnimationFrame(updateVolume)
      }

      // Start initial analysis frame
      updateVolume()
    } catch (err) {
      // Error handling per Exception Policy 5.1
      setError(err instanceof Error ? err : new Error('Audio analysis initialization failed'))
      stopAnalysis()
    }
  }, [stopAnalysis, minDb, maxDb])

  return {
    currentVolume,
    error,
    initializeAnalysis,
    stopAnalysis,
    debugValues
  }
}
