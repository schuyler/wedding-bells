import { LoadingSpinner } from './LoadingSpinner'
import { ProgressBar } from './ProgressBar'
import { ErrorModal } from './ErrorModal'

/**
 * Props interface for the UploadProgress component.
 * 
 * Defines the essential properties needed to display and manage the upload process
 * state within the application's recording flow.
 * 
 * @property fileName - The name of the file being uploaded (displayed to the user)
 * @property progress - Numeric value between 0-100 representing upload completion percentage
 * @property status - Current state of the upload process (idle, uploading, completed, error)
 * @property error - Optional error message to display when status is 'error'
 * @property onRetry - Optional callback function to retry a failed upload
 * @property onComplete - Optional callback function triggered when upload is complete
 */
interface UploadProgressProps {
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'completed' | 'error'
  error?: string
  onRetry?: () => void
  onComplete?: () => void
  retryAttempt?: number
}

/**
 * Upload progress visualization and management component.
 * 
 * This component provides visual feedback during the file upload process, showing
 * progress percentage, current status, and handling error states. It represents
 * the third step in the overall recording flow (welcome → recording → upload → thank you).
 *
 * Application Flow Integration:
 * - Appears after a user finishes recording their message
 * - When upload completes (progress reaches 100%), shows a continue button
 * - Continue button triggers onComplete callback which transitions to the thank you state
 * - On error, displays error modal with retry option if onRetry is provided
 * 
 * Key features:
 * - Displays the file name and current upload status
 * - Shows visual progress via the ProgressBar component
 * - Provides error handling through ErrorModal for failed uploads
 * - Conditionally renders a continue button when upload is complete
 * - Supports retry functionality for failed uploads
 * 
 * The component changes its appearance based on the current status:
 * - idle: Shows a "Preparing to upload..." message with a spinner
 * - uploading: Displays progress with a blue progress bar
 * - completed: Shows a green progress bar with a checkmark and continue button
 * - error: Displays a yellow/warning progress bar and error modal
 * 
 * Implementation notes:
 * - Pure presentational component with no internal state management
 * - All state (progress, status, error) is controlled by parent components
 * - Uses the getStatusDetails helper function to centralize status-dependent UI elements
 * 
 * Known issues:
 * - The ErrorModal's onClose prop is set to an empty function (() => {}) which means
 *   the modal cannot be dismissed by the user. This appears to be incomplete implementation.
 * - Error handling relies entirely on parent components with no internal error detection
 * 
 * Opportunities for improvement:
 * - Add proper onClose handler for ErrorModal to make it dismissible by users
 * - Implement basic validation of input props (e.g., ensure progress is between 0-100)
 * - Consider adding internal state to track retry attempts and potentially rate limit retries
 * - Add more detailed progress information (e.g., transfer rate, time remaining)
 * - Implement specific error handling for different types of upload failures
 * - Add a cancellation option during upload for better user experience
 * - Consider adding accessibility attributes for screen readers
 * - Make status messages configurable via props for easier customization
 */
export function UploadProgress({
  fileName,
  progress,
  status,
  error,
  onRetry,
  onComplete,
  retryAttempt
}: UploadProgressProps) {
  /**
   * Determines the appropriate status details based on current upload state.
   * 
   * Returns an object with:
   * - message: Text to display underneath the filename
   * - icon: Visual indicator for the current status (spinner, checkmark, error icon)
   * 
   * This approach centralizes the state-dependent UI elements in one function
   * rather than scattering conditional logic throughout the component.
   */
  const getStatusDetails = () => {
    switch (status) {
      case 'idle':
        return {
          message: 'Preparing to upload...',
          icon: <LoadingSpinner size="sm" />
        }
      case 'uploading':
        return {
          message: retryAttempt 
            ? `Retry attempt ${retryAttempt}... Please stay on this page.` 
            : 'Uploading your message...',
          icon: retryAttempt ? (
            <svg
              className="w-5 h-5 text-yellow-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ) : null
        }
      case 'completed':
        return {
          message: 'Upload complete!',
          icon: (
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )
        }
      case 'error':
        return {
          message: 'Upload failed',
          icon: (
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )
        }
    }
  }

  const { message, icon } = getStatusDetails()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
      </div>

      <ProgressBar
        progress={progress}
        variant={status === 'completed' ? 'success' : status === 'error' ? 'warning' : 'primary'}
        size="md"
      />

      {error && (
        <ErrorModal
          isOpen={!!error}
          onClose={onRetry || (() => {})}
          title="Upload Failed"
          description={error}
          action={
            onRetry
              ? {
                  label: 'Retry Upload',
                  onClick: onRetry
                }
              : undefined
          }
        />
      )}

      {status === 'completed' && (
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
