import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

/**
 * Interface for the AudioRecorderControls ref object.
 * Provides a comprehensive set of methods for managing audio recording.
 */
export interface AudioRecorderControls {
  checkPermission: () => Promise<boolean>
  hasPermission: () => boolean | null
  startRecording: () => Promise<Blob | null>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
}

/**
 * Props for the AudioRecorderControl component.
 * Defines callback mechanisms for recording state and data management.
 */
interface AudioRecorderControlProps {
  onRecordingData?: (blob: Blob) => void
  onStateChange?: (state: { 
    isRecording: boolean; 
    isPaused: boolean; 
    duration: number 
  }) => void
  onPermissionChange?: (hasPermission: boolean | null) => void
  onError?: (error: Error) => void
  maxDuration?: number
  children: React.ReactNode
}

/**
 * AudioRecorderControl: Centralized audio recording management component.
 * 
 * Responsibilities:
 * - Manage microphone permissions
 * - Control recording lifecycle
 * - Provide recording state updates
 * - Handle MediaRecorder interactions
 */
export const AudioRecorderControl = forwardRef<AudioRecorderControls, AudioRecorderControlProps>(
  (
    { 
      onRecordingData, 
      onStateChange, 
      onPermissionChange, 
      onError, 
      maxDuration = 15 * 60, // 15 minutes default
      children 
    },
    ref
  ) => {
    // Debug state
    const [chunkCount, setChunkCount] = useState(0);
    const [totalDataSize, setTotalDataSize] = useState(0);

    // Core refs for recording management
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const recordingDurationRef = useRef(0)
    const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // State management
    const [permissionState, setPermissionState] = useState<boolean | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    // Stop duration tracking timer
    const stopDurationTimer = useCallback(() => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }
    }, [])

    // Stop recording
    const stopRecording = useCallback(async () => {
      if (!isRecording) return null

      try {
        // Get the MIME type from the media recorder (or use webm as default)
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        
        // Stop MediaRecorder
        mediaRecorderRef.current?.stop()
        
        // Stop duration tracking
        stopDurationTimer()

        // Create blob from recorded chunks using the same MIME type as the recorder
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        
        return audioBlob
      } catch (error) {
        onError?.(
          error instanceof Error 
            ? error 
            : new Error('Failed to stop recording')
        )
        return null
      }
    }, [isRecording, stopDurationTimer, onError])

    // Start duration tracking timer
    const startDurationTimer = useCallback(() => {
      recordingDurationRef.current = 0
      durationTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1
        
        // Check if max duration reached
        if (recordingDurationRef.current >= maxDuration) {
          stopRecording()
        }

        onStateChange?.({
          isRecording: true,
          isPaused: false,
          duration: recordingDurationRef.current
        })
      }, 1000)
    }, [maxDuration, onStateChange, stopRecording])

    // Cleanup resources
    const cleanupRecording = useCallback(() => {
      stopDurationTimer()
      
      // Stop media stream tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      mediaRecorderRef.current = null
      audioChunksRef.current = []
    }, [stopDurationTimer])

    // Permission checking implementation
    const checkPermission = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000,
          },
        })
        
        // Stop tracks immediately after checking
        stream.getTracks().forEach((track) => track.stop())
        
        setPermissionState(true)
        onPermissionChange?.(true)
        return true
      } catch (error) {
        setPermissionState(false)
        onPermissionChange?.(false)
        onError?.(
          error instanceof Error ? error : new Error('Permission denied')
        )
        return false
      }
    }, [onPermissionChange, onError])

    // Start recording
    const startRecording = useCallback(async () => {
      // Check and request permission if needed
      if (!permissionState) {
        const granted = await checkPermission()
        if (!granted) {
          // Instead of throwing, call the error callback
          onError?.(new Error('Permission required'))
          return null
        }
      }

      try {
        // Get fresh media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000,
          },
        })

        mediaStreamRef.current = stream
        
        // Reset debug counters
        setChunkCount(0);
        setTotalDataSize(0);

        // Determine the best supported audio format based on capability detection
        let mimeType = '';

        // Prioritized list of MIME types to try
        const supportedMimeTypes = [
          'audio/webm;codecs=opus',  // Best quality, widely supported in modern browsers
          'audio/webm',              // Good fallback for Chrome, Firefox, Edge
          'audio/mp4',               // Safari support
          'audio/aac',               // Another option for Safari 
          'audio/ogg;codecs=opus',   // Alternative for some browsers
          ''                         // Empty string as last resort (browser default)
        ];
        
        // Find the first supported MIME type
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          for (const type of supportedMimeTypes) {
            if (!type || MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              break;
            }
          }
        }
        
        // Log the selected MIME type in development
        if (import.meta.env.DEV) {
          console.log(`Using MIME type: ${mimeType || 'browser default'}`);
        }
        
        // Create MediaRecorder with detected MIME type
        const mediaRecorder = mimeType 
          ? new MediaRecorder(stream, { mimeType }) 
          : new MediaRecorder(stream)

        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        // Event handlers
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
            
            // Update debug information
            setChunkCount(prev => prev + 1);
            setTotalDataSize(prev => prev + event.data.size);
            console.log(`Chunk #${chunkCount + 1} received, size: ${event.data.size} bytes`);
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
          
          // Notify of recording data
          if (audioBlob.size > 0) {
            onRecordingData?.(audioBlob)
          }

          // Update state
          setIsRecording(false)
          setIsPaused(false)
          
          // Notify state change
          onStateChange?.({
            isRecording: false,
            isPaused: false,
            duration: recordingDurationRef.current
          })

          // Cleanup
          cleanupRecording()
        }

        // Start recording
        mediaRecorder.start(100) // Collect data every 100ms
        setIsRecording(true)
        setIsPaused(false)

        // Start duration tracking
        startDurationTimer()

        // Notify state change
        onStateChange?.({
          isRecording: true,
          isPaused: false,
          duration: 0
        })

        return null // For API compatibility
      } catch (error) {
        onError?.(
          error instanceof Error 
            ? error 
            : new Error('Failed to start recording')
        )
        return null
      }
    }, [
      permissionState, 
      checkPermission, 
      onRecordingData, 
      onStateChange, 
      onError, 
      startDurationTimer, 
      cleanupRecording
    ])

    // Pause recording
    const pauseRecording = useCallback(() => {
      if (!isRecording || isPaused) return

      try {
        mediaRecorderRef.current?.pause()
        setIsPaused(true)
        stopDurationTimer()

        // Notify state change
        onStateChange?.({
          isRecording: true,
          isPaused: true,
          duration: recordingDurationRef.current
        })
      } catch (error) {
        onError?.(
          error instanceof Error 
            ? error 
            : new Error('Failed to pause recording')
        )
      }
    }, [isRecording, isPaused, stopDurationTimer, onStateChange, onError])

    // Resume recording
    const resumeRecording = useCallback(async () => {
      if (!isRecording || !isPaused) return

      try {
        mediaRecorderRef.current?.resume()
        setIsPaused(false)
        startDurationTimer()

        // Notify state change
        onStateChange?.({
          isRecording: true,
          isPaused: false,
          duration: recordingDurationRef.current
        })
      } catch (error) {
        onError?.(
          error instanceof Error 
            ? error 
            : new Error('Failed to resume recording')
        )
      }
    }, [isRecording, isPaused, startDurationTimer, onStateChange, onError])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupRecording()
      }
    }, [cleanupRecording])
    
    // Prevent navigation while recording
    useEffect(() => {
      // Only add the event listener if recording is active
      if (isRecording) {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          // Standard way to show a confirmation dialog
          const message = 'You have an active recording in progress. Are you sure you want to leave?';
          
          // Modern browsers require both of these for the confirmation dialog to appear
          // Even though returnValue is deprecated, it's still required for cross-browser compatibility
          e.preventDefault();
          e.returnValue = message;
          
          // Returning a string triggers the confirmation dialog in older browsers
          return message;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Clean up by removing the event listener
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }
    }, [isRecording])

    // Expose controls via ref
    useImperativeHandle(
      ref,
      () => ({
        checkPermission,
        hasPermission: () => permissionState,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording
      }),
      [
        permissionState, 
        checkPermission, 
        startRecording, 
        stopRecording, 
        pauseRecording, 
        resumeRecording
      ]
    )

    return (
      <>
        {false && isRecording && (
          <div className="bg-gray-100 p-2 rounded-md text-xs font-mono mt-2 mb-2">
            <div>Recording Debug Info:</div>
            <div>Chunks collected: {chunkCount}</div>
            <div>Total data size: {totalDataSize} bytes</div>
          </div>
        )}
        {children}
      </>
    )
  }
)

AudioRecorderControl.displayName = 'AudioRecorderControl'
