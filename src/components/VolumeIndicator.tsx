interface VolumeIndicatorProps {
  volume: number // 0 to 1
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function VolumeIndicator({
  volume,
  size = 'md',
  className = ''
}: VolumeIndicatorProps) {
  const bars = 10
  const activeBarCount = Math.floor(volume * bars)
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20'
  }

  const getBarColor = (index: number) => {
    const isActive = index < activeBarCount
    if (!isActive) return 'bg-gray-200'

    // Colors: green up to 7th bar, yellow for 8th and 9th, red for 10th
    if (index < bars - 3) return 'bg-green-500'
    if (index < bars - 1) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div
      className={`flex items-end justify-center space-x-1 ${sizeClasses[size]} ${className}`}
      role="meter"
      aria-valuenow={Math.round(volume * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio volume level"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 transition-all duration-100 rounded-t ${getBarColor(i)}`}
          style={{
            height: `${((i + 1) / bars * 100)}%`,
            opacity: i < activeBarCount ? '1' : '0.5'
          }}
        />
      ))}
    </div>
  )
}
