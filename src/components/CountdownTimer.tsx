import { useEffect, useState, useCallback } from 'react'

interface CountdownTimerProps {
  duration: number // in seconds
  onComplete?: () => void
  running?: boolean
  className?: string
}

export function CountdownTimer({
  duration,
  onComplete,
  running = true,
  className = ''
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [startTime] = useState(Date.now())

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  // Calculate progress percentage (0 to 100)
  const progress = ((duration - timeLeft) / duration) * 100

  // Calculate the stroke dash for the progress ring
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference

  useEffect(() => {
    if (!running) return

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = duration - elapsed

      if (remaining <= 0) {
        clearInterval(timer)
        setTimeLeft(0)
        onComplete?.()
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [duration, startTime, running, onComplete])

  // Define warning colors based on time remaining
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
