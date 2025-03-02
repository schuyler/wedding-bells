/**
 * Progress bar component with configurable sizing and status variants.
 * 
 * Responsibilities:
 * - Visual representation of progress percentage
 * - Color coding for different status states
 * - Responsive sizing options
 * - Accessible progress reporting via ARIA
 * 
 * Implementation Notes:
 * - Uses Tailwind transition utilities for smooth width changes
 * - Clamps progress between 0-100 to ensure valid values
 * - Inline width style used for precise control over bar progression
 * - Variant colors follow standard semantic conventions
 * 
 * Improvement Opportunities:
 * 1. Variant Expansion: Current options (primary/success/warning) could be extended
 *    to include 'error' and 'neutral' states for better flexibility
 * 2. Animation: Consider spring-based animations for more natural motion
 * 3. Indeterminate State: Add support for unknown progress durations
 * 4. Compound Components: Create ProgressBar+Label combination variant
 */
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
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-300 rounded-full ${className}`}
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
