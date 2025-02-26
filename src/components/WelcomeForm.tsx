import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BrowserCompatibility, GuestInfo, guestInfoSchema, GuestInfoSchema } from '../types'
import { ErrorModal } from './ErrorModal'
import { BrowserCheck } from './BrowserCheck'
import { LoadingSpinner } from './LoadingSpinner'

interface WelcomeFormProps {
  onSubmit: (data: GuestInfo) => void
}

export function WelcomeForm({ onSubmit }: WelcomeFormProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<{
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  } | null>(null)
  const [compatibility, setCompatibility] = useState<BrowserCompatibility>({
    hasAudioSupport: false,
    hasMicrophonePermission: false,
    hasWaveSurferSupport: false
  })
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<GuestInfoSchema>({
    resolver: zodResolver(guestInfoSchema)
  })

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch (error) {
      console.error('Microphone access denied:', error)
      return false
    }
  }

  const onFormSubmit = async (data: GuestInfoSchema) => {
    setIsChecking(true)
    const hasAccess = await requestMicrophoneAccess()
    
    if (!hasAccess) {
      setError({
        title: 'Microphone Access Required',
        description: 'Please allow microphone access to record your message. Click "Try Again" after enabling the microphone in your browser settings.',
        action: {
          label: 'Try Again',
          onClick: async () => {
            const granted = await requestMicrophoneAccess()
            if (granted) {
              setError(null)
              onSubmit(data)
            }
          }
        }
      })
    } else {
      onSubmit(data)
    }
    setIsChecking(false)
  }

  const handleCompatibilityChange = (newCompatibility: BrowserCompatibility) => {
    setCompatibility(newCompatibility)
    
    // If microphone permission is already granted, update the state
    if (newCompatibility.hasMicrophonePermission) {
      setError(null)
    }
  }

  // Show browser compatibility check first
  if (!compatibility.hasAudioSupport) {
    return <BrowserCheck onCompatibilityChange={handleCompatibilityChange} />
  }

  return (
    <div className="space-y-6">
      {/* Show warning for limited visualization support */}
      {!compatibility.hasWaveSurferSupport && (
        <BrowserCheck onCompatibilityChange={handleCompatibilityChange} />
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Leave a Message for Marc & Sea
        </h2>
        <p className="text-gray-600">
          Record a personal message for the happy couple that they can cherish forever.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            disabled={isChecking || isSubmitting}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500`}
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isChecking || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors flex justify-center items-center space-x-2 ${
            isChecking || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isChecking || isSubmitting ? (
            <>
              <LoadingSpinner size="sm" light />
              <span>{isChecking ? 'Checking Microphone...' : 'Starting Recording...'}</span>
            </>
          ) : (
            'Start Recording'
          )}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center">
        You'll have up to 15 minutes to record your message
      </p>

      {error && (
        <ErrorModal
          isOpen={!!error}
          onClose={() => setError(null)}
          title={error.title}
          description={error.description}
          action={error.action}
        />
      )}
    </div>
  )
}
