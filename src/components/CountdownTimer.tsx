import { useEffect, useState, useCallback } from 'react'

/**
 * Props interface for the CountdownTimer component.
 * 
 * @property duration - Total duration in seconds to count down from
 * @property onComplete - Optional callback triggered when countdown reaches zero
 * @property running - Whether the timer is actively counting down or paused
 * @property className - Optional CSS class names for styling customization
 */
interface CountdownTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  running?: boolean
  className?: string
}

/**
 * Visual countdown timer with progress ring visualization.
 * 
 * This component provides a countdown timer displayed as a circular progress ring
 * with color transitions as time decreases. It's primarily used during audio recording
 * to show the remaining time within the maximum duration limit.
 * 
 * Implementation details:
 * - Uses setInterval for periodic updates of remaining time
 * - Calculates elapsed time based on wall clock (Date.now() - startTime)
 * - Visualizes progress with SVG circle and stroke-dashoffset animation
 * - Changes color (blue → yellow → red) as time remaining decreases
 * 
 * Opportunities for improvement:
 * - The timer doesn't properly handle pauses since it always measures from component
 *   initialization. This could lead to incorrect time display when recording is
 *   paused and resumed. A better approach would be to track accumulated time
 *   between pauses.
 * - The progress calculation will be incorrect if pausing and resuming occurs.
 * - There's no provision for resetting the timer or adjusting the duration
 *   after initialization.
 * - This component may be affected by the app's general state transition
 *   inconsistencies.
 */
export function CountdownTimer({
  duration,
  onComplete,
  running = true,
  className = ''
}: CountdownTimerProps) {
  // Track remaining time and elapsed time separately
  const [timeLeft, setTimeLeft] = useState(duration)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  /**
   * Formats seconds into MM:SS display format.
   * 
   * @param seconds - Number of seconds to format
   * @returns Formatted time string (e.g., "15:42")
   */
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Calculate progress percentage (0 to 100)
  const progress = (elapsedSeconds / duration) * 100

  // Calculate the stroke dash for the progress ring
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  // Reset timer if duration changes
  useEffect(() => {
    setTimeLeft(duration)
    setElapsedSeconds(0)
  }, [duration])

  /**
   * Timer effect to update the countdown display.
   * 
   * Only counts down when running is true.
   * Updates one second at a time using setInterval.
   * Triggers onComplete callback when countdown reaches zero.
   */
  useEffect(() => {
    // Don't run the timer when paused
    if (!running) return
    
    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1
        
        // Calculate new time left
        const newTimeLeft = duration - newElapsed
        setTimeLeft(Math.max(0, newTimeLeft))
        
        // Check if timer completed
        if (newTimeLeft <= 0) {
          clearInterval(timer)
          onComplete?.()
        }
        
        return newElapsed
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [running, duration, onComplete])

  /**
   * Determines color class based on remaining time percentage.
   * 
   * Color logic:
   * - Blue (default): More than 30% time remaining
   * - Yellow (warning): Between 10-30% time remaining
   * - Red (critical): Less than 10% time remaining
   * 
   * @returns CSS class names for text and stroke colors
   */
  const getColorClass = () => {
    const percentage = (timeLeft / duration) * 100
    if (percentage <= 10) return 'text-red-500 stroke-red-500'
    if (percentage <= 30) return 'text-yellow-500 stroke-yellow-500'
    return 'text-blue-500 stroke-blue-500'
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* SVG Progress Ring */}
      <svg className="transform -rotate-90 w-24 h-24">
        {/* Background circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          className="stroke-gray-200"
          strokeWidth="4"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          className={`${getColorClass()} transition-all duration-1000`}
          strokeWidth="4"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      
      {/* Time Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${getColorClass()} font-mono text-xl font-medium`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  )
}
