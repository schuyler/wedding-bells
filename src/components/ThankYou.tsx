/**
 * Props interface for the ThankYou component.
 * 
 * @property guestName - Name of the guest who recorded the message
 * @property onRecordAnother - Callback function to restart the recording process
 */
interface ThankYouProps {
  guestName: string
  onRecordAnother: () => void
}

/**
 * Final confirmation screen displayed after successful message recording.
 * 
 * This component serves as the final step in the recording flow, providing 
 * confirmation that the guest's message has been successfully recorded and 
 * offering options to share or record another message.
 * 
 * Implementation details:
 * - Displays a success message with the guest's name
 * - Provides a button to record another message
 * - Includes a basic sharing feature using Web Share API with clipboard fallback
 * - Shows minimal error handling for non-critical sharing functionality
 * 
 * Features:
 * 1. Success confirmation with personalized message
 * 2. Option to record another message
 * 3. Basic social sharing functionality
 * 4. Simple, focused user interface with clear calls to action
 * 
 * Technical notes:
 * - Uses navigator.share API when available with fallback to clipboard
 * - Contains hardcoded text that ideally should be configurable
 * - Has minimal error handling for share/copy functionality (console.error only)
 * - Includes a placeholder message about viewing messages after the wedding
 * 
 * Improvement opportunities:
 * 1. Text configuration:
 *    - Make all text content configurable rather than hardcoded
 *    - Consider extracting text to a centralized content configuration
 * 
 * 2. Enhanced sharing:
 *    - Add more sharing options for browsers without Web Share API
 *    - Improve visual feedback for successful/failed copy operations
 * 
 * 3. UI enhancements:
 *    - Add animations for a more celebratory feel
 *    - Consider adding the option to replay the recorded message
 */
export function ThankYou({ guestName, onRecordAnother }: ThankYouProps) {
  const shareMessage = `I just recorded a message for Marc & Sea's wedding! 🎉 #WavesOfLove`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wedding Message Recorded',
          text: shareMessage,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or share failed
        console.error('Share failed:', error)
      }
    } else {
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(`${shareMessage}\n${window.location.href}`)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-wedding-light/10 p-3 border border-wedding-light/30">
          <svg
            className="w-12 h-12 text-wedding-light"
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
        </div>
      </div>

      <div>
        <h2 className="text-2xl tracking-heading uppercase mb-2">
          Thank You, {guestName}!
        </h2>
        <p className="text-wedding-light/80 font-eb-garamond">
          Your message has been recorded and will be cherished by Marc & Sea.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onRecordAnother}
          className="bg-wedding-light hover:bg-white text-wedding-dark font-medium py-2 px-6 rounded-sm uppercase tracking-wedding transition-colors"
        >
          Record Another
        </button>
        <button
          onClick={handleShare}
          className="bg-transparent hover:bg-wedding-light/20 text-wedding-light border border-wedding-light/50 font-medium py-2 px-6 rounded-sm uppercase tracking-wedding transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </button>
      </div>

      <p className="text-sm text-wedding-light/60 font-eb-garamond">
        Want to view all messages? Check back after the wedding!
      </p>
    </div>
  )
}