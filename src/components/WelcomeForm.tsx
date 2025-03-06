import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BrowserCompatibility, GuestInfo, guestInfoSchema, GuestInfoSchema } from '../types'
import { ErrorModal } from './ErrorModal'
import { BrowserCheck } from './BrowserCheck'
import { LoadingSpinner } from './LoadingSpinner'

/**
 * Props interface for the WelcomeForm component.
 * 
 * @property onSubmit - Callback function invoked with guest information when form is successfully submitted
 * @property defaultValues - Optional default values for the form fields
 */
interface WelcomeFormProps {
  onSubmit: (data: GuestInfo) => void;
  defaultValues?: Partial<GuestInfo>;
}

/**
 * Initial entry form component for collecting guest information.
 * 
 * This component serves as the first step in the recording flow, gathering 
 * essential guest information before proceeding to audio recording. It handles 
 * form validation, microphone permission checks, and browser compatibility verification.
 * 
 * Implementation details:
 * - Uses react-hook-form with Zod schema validation
 * - Performs microphone permission checking after form submission
 * - Shows appropriate error modals for permission issues
 * - Conditionally renders BrowserCheck for incompatible browsers
 * - Provides loading states during permission checks and form submission
 * 
 * Primary responsibilities:
 * 1. Collect and validate guest name
 * 2. Check browser compatibility for audio recording
 * 3. Request microphone permissions
 * 4. Handle various error states with appropriate user feedback
 * 
 * Technical concerns:
 * - The component currently handles multiple responsibilities (form validation, 
 *   permission checking, and browser compatibility) which violates the Single 
 *   Responsibility Principle
 * - Permission checking is duplicated between this component and AudioRecorder
 * - There's confusion in the relationship with BrowserCheck components (also 
 *   rendered in parent App component)
 * 
 * Improvement opportunities:
 * 1. Separate concerns:
 *    - Extract permission handling to a dedicated hook (e.g., useMicrophonePermission)
 *    - Move browser compatibility checking to a higher-level component or context
 *    - Keep WelcomeForm focused solely on form collection and validation
 * 
 * 2. Establish clear permission flow:
 *    - Consider deferring microphone permission until recording actually starts
 *    - Centralize permission state in a context to prevent duplicate checks
 * 
 * 3. Improve error handling:
 *    - Create more specific error types for different scenarios
 *    - Add more helpful guidance for resolving permission issues on different browsers
 * 
 * 4. Enhance accessibility:
 *    - Add proper ARIA attributes to form elements
 *    - Ensure keyboard navigation works correctly
 *    - Add better focus management during errors and loading states
 */
export function WelcomeForm({ onSubmit, defaultValues }: WelcomeFormProps) {
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
    resolver: zodResolver(guestInfoSchema),
    defaultValues: defaultValues
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
        <h2 className="text-xl md:text-2xl mb-3">
          Record a message for the wedding podcast
        </h2>
        <p className="text-wedding-light/80 font-eb-garamond">
          Share your favorite memory, well wishes, or advice for the newlyweds!
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-wedding-light mb-1 tracking-wider">
            YOUR NAME
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            autoComplete="off"
            disabled={isChecking || isSubmitting}
            className={`w-full px-4 py-2 rounded-sm bg-wedding-dark border ${
              errors.name ? 'border-red-400' : 'border-wedding-light/50'
            } focus:outline-none focus:ring-1 focus:ring-wedding-light text-wedding-light font-eb-garamond disabled:bg-wedding-dark/70 disabled:text-wedding-light/50`}
            placeholder="Enter your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isChecking || isSubmitting}
          className={`w-full py-3 px-4 rounded-sm font-medium tracking-wedding flex justify-center items-center space-x-2 ${
            isChecking || isSubmitting
              ? 'bg-wedding-light/30 text-wedding-dark/50 cursor-not-allowed'
              : 'bg-wedding-light text-wedding-dark hover:bg-white'
          }`}
        >
          {isChecking || isSubmitting ? (
            <>
              <LoadingSpinner size="sm" light={false} />
              <span>{isChecking ? 'Checking Microphone...' : 'Continuing...'}</span>
            </>
          ) : (
            'CONTINUE'
          )}
        </button>
      </form>

      <p className="text-sm text-wedding-light/70 text-center font-eb-garamond">
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