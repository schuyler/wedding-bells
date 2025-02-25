import { Fragment, ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'

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
                  rounded-2xl
                  bg-white
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
                      className="h-6 w-6 text-red-500"
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
                      className="text-base sm:text-lg font-semibold leading-6 text-gray-900"
                    >
                      {title}
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
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
                      rounded-lg
                      px-4
                      py-2.5
                      sm:py-2
                      text-sm
                      font-medium
                      text-gray-900
                      bg-gray-100
                      hover:bg-gray-200
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-gray-500
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
                        rounded-lg
                        px-4
                        py-2.5
                        sm:py-2
                        text-sm
                        font-medium
                        text-white
                        bg-blue-500
                        hover:bg-blue-600
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-blue-500
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
