interface ProgressBarProps {
  progress: number // 0 to 100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  variant?: 'primary' | 'success' | 'warning'
}

export function ProgressBar({
  progress,
  size = 'md',
  showLabel = true,
  className = '',
  variant = 'primary'
}: ProgressBarProps) {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress))

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const variantClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 rounded-full`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right">
          <span className="text-sm text-gray-600">{Math.round(clampedProgress)}%</span>
        </div>
      )}
    </div>
  )
}
