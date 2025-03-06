import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'

/**
 * Props interface for the ErrorModal component.
 * 
 * Provides configuration options for error display, visibility control,
 * and action buttons.
 * 
 * @property isOpen - Controls visibility of the modal
 * @property onClose - Callback function when modal is closed (via backdrop click or close button)
 * @property title - Main error heading displayed at the top of the modal
 * @property description - Text description of the error
 * @property action - Optional primary action button configuration
 * @property children - Optional additional content to render below the description
 */
interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

/**
 * Error display modal component with consistent styling and behavior.
 * 
 * This component renders a modal dialog for displaying errors and providing
 * recovery options to users. It uses HeadlessUI components (Dialog, Transition)
 * for accessibility and animations.
 * 
 * Key features:
 * - Animated appearance/disappearance with backdrop blur
 * - Consistent error styling with warning icon
 * - Support for primary action button (e.g., retry) and close button
 * - Optional children for extended error information or custom content
 * 
 * Integration points:
 * - Used by multiple components including UploadProgress and WelcomeForm
 * - Serves as a standardized error presentation layer throughout the application
 * - Primary way to alert users about recoverable errors
 * 
 * Implementation notes:
 * - The component uses HeadlessUI's Dialog for accessibility features
 * - Transitions provide smooth animations for better UX
 * - Responsive design adapts to different screen sizes
 * - Default z-index (z-50) ensures modal appears above other content
 * 
 * Current limitations:
 * - No built-in error state management (relies on parent components)
 * - Multiple error modals could potentially stack if triggered simultaneously
 * - Cannot be easily extended with additional actions without modifying the component
 * - No standardized error categorization (warning vs. critical)
 * 
 * Improvement opportunities:
 * - Add support for different severity levels (warning, error, critical)
 * - Implement a more flexible action button system to support multiple actions
 * - Consider adding a built-in timeout option for auto-dismissal
 * - Add escape key handling for better keyboard accessibility
 * - Consider implementing a global error handler that uses this component
 * - Standardize error types and messages across the application
 * - Add error logging functionality
 */
export function ErrorModal({
  isOpen,
  onClose,
  title,
  description,
  action,
  children
}: ErrorModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className="
                  w-full
                  max-w-md
                  transform
                  overflow-hidden
                  rounded-sm
                  bg-wedding-dark
                  border
                  border-wedding-light/40
                  p-4
                  sm:p-6
                  text-left
                  align-middle
                  shadow-xl
                  transition-all
                "
              >
                {/* Header with Icon */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Dialog.Title
                      as="h3"
                      className="text-base sm:text-lg uppercase tracking-heading font-medium text-wedding-light"
                    >
                      {title}
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-wedding-light/80 font-eb-garamond">
                        {description}
                      </p>
                      {children}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div 
                  className="
                    mt-6
                    flex
                    flex-col-reverse
                    sm:flex-row
                    sm:justify-end
                    gap-3
                  "
                >
                  <button
                    type="button"
                    className="
                      w-full
                      sm:w-auto
                      inline-flex
                      justify-center
                      items-center
                      rounded-sm
                      px-4
                      py-2.5
                      sm:py-2
                      text-sm
                      uppercase
                      tracking-wedding
                      font-medium
                      bg-transparent
                      border
                      border-wedding-light/50
                      text-wedding-light
                      hover:bg-wedding-light/20
                      focus:outline-none
                      focus-visible:ring-1
                      focus-visible:ring-wedding-light
                      focus-visible:ring-offset-2
                      transition-colors
                      min-h-[44px]
                      sm:min-h-0
                    "
                    onClick={onClose}
                  >
                    Close
                  </button>
                  {action && (
                    <button
                      type="button"
                      className="
                        w-full
                        sm:w-auto
                        inline-flex
                        justify-center
                        items-center
                        rounded-sm
                        px-4
                        py-2.5
                        sm:py-2
                        text-sm
                        uppercase
                        tracking-wedding
                        font-medium
                        bg-wedding-light
                        text-wedding-dark
                        hover:bg-white
                        focus:outline-none
                        focus-visible:ring-1
                        focus-visible:ring-wedding-light
                        focus-visible:ring-offset-2
                        transition-colors
                        min-h-[44px]
                        sm:min-h-0
                      "
                      onClick={action.onClick}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}