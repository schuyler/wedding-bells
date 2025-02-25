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
        <div className="flex items-center space-x-2 sm:space-x-3">
          {states.map((state, index) => (
            <div key={state} className="flex items-center">
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
              {/* Connector Line */}
              {index < states.length - 1 && (
                <div 
                  className={`
                    w-4 sm:w-6 h-0.5
                    transition-colors
                    ${index < states.indexOf(currentState)
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                    }
                  `}
                />
              )}
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
