import { RecordingState } from '../types'

interface ProgressIndicatorProps {
  currentState: RecordingState
  states?: RecordingState[]
}

export function ProgressIndicator({
  currentState,
  states = ['welcome', 'recording', 'preview', 'upload', 'thankyou']
}: ProgressIndicatorProps) {
  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Progress Steps */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-8 sm:space-x-14 relative">
          {states.map((state, index) => (
            <div key={state} className="relative">
              {/* Connector Line */}
              {index < states.length - 1 && (
                <div 
                  className={`
                    absolute top-1/2 left-full h-0.5
                    w-8 sm:w-14
                    -translate-y-1/2
                    transition-colors
                    ${index < states.indexOf(currentState)
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                    }
                  `}
                />
              )}
              {/* Progress Dot */}
              <div
                className={`
                  w-2.5 h-2.5 sm:w-3 sm:h-3
                  rounded-full
                  transition-colors
                  ${index <= states.indexOf(currentState)
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                  }
                `}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-xs sm:text-sm text-gray-600">
        Step {states.indexOf(currentState) + 1} of {states.length}
      </div>

      {/* Step Label - Optional enhancement */}
      <div className="text-sm sm:text-base font-medium text-gray-800 capitalize">
        {currentState === 'welcome' ? 'Get Started' : currentState}
      </div>
    </div>
  )
}
