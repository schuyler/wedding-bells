import { LoadingSpinner } from './LoadingSpinner'
import { ProgressBar } from './ProgressBar'
import { ErrorModal } from './ErrorModal'

interface UploadProgressProps {
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'completed' | 'error'
  error?: string
  onRetry?: () => void
  onComplete?: () => void
}

export function UploadProgress({
  fileName,
  progress,
  status,
  error,
  onRetry,
  onComplete
}: UploadProgressProps) {
  const getStatusDetails = () => {
    switch (status) {
      case 'idle':
        return {
          message: 'Preparing to upload...',
          icon: <LoadingSpinner size="sm" />
        }
      case 'uploading':
        return {
          message: 'Uploading your message...',
          icon: null
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
            <p className="text-sm font-medium text-gray-900">{fileName}</p>
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
          onClose={() => {}}
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
