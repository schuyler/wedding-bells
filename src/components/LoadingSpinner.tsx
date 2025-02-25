interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  light?: boolean
  label?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ 
  size = 'md', 
  light = false,
  label,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  }

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const spinnerContent = (
    <div className={`
      flex 
      items-center 
      gap-3
      ${fullScreen ? 'flex-col' : ''}
    `}>
      <div 
        className={`
          animate-spin 
          rounded-full
          ${sizeClasses[size]}
          ${light ? 'border-white' : 'border-blue-600'}
          border-t-transparent
        `}
        role="progressbar"
        aria-label="Loading"
      />
      {label && (
        <span className={`
          ${light ? 'text-white' : 'text-gray-700'}
          ${labelSizeClasses[size]}
          font-medium
        `}>
          {label}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}
