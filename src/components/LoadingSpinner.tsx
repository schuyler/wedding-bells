/**
 * Loading spinner component with configurable sizing and overlay variants.
 * 
 * Responsibilities:
 * - Visual feedback during asynchronous operations
 * - Accessible progress indication
 * - Flexible sizing for different UI contexts
 * - Full-screen overlay capability for page-level loading
 * 
 * Implementation Notes:
 * - Uses CSS border animation technique for smooth spinning effect
 * - Implements WAI-ARIA progressbar role for accessibility
 * - Provides size variants through Tailwind class maps
 * - Supports full-screen mode with semi-transparent backdrop
 * 
 * Common Usage Patterns:
 * - Form submission states (seen in WelcomeForm.tsx)
 * - Audio recording initialization (AudioRecorder.tsx)
 * - File upload progression (UploadProgress.tsx)
 * - Full-page loading transitions
 * 
 * Improvement Opportunities:
 * 1. Animation Variants: Add pulse/spin speed options
 * 2. Color Customization: Allow theme-based coloring
 * 3. Progress Percentage: Add numeric progress display
 * 4. ARIA Enhancements: Implement aria-valuenow for determinate states
 */
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
