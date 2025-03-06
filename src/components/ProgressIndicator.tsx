import { RecordingState } from '../types'

/**
 * Props interface for the ProgressIndicator component.
 * 
 * @property currentState - The current active state in the recording flow
 * @property states - Optional array of states to display in the progress indicator
 */
interface ProgressIndicatorProps {
  currentState: RecordingState
  states?: RecordingState[]
}

/**
 * Visual progress indicator for the multi-step recording flow.
 * 
 * This component displays a horizontal progress bar with dots representing
 * each step in the recording process, highlighting the current step and
 * showing completed steps. It provides users with visual feedback about
 * their position in the overall recording flow.
 * 
 * Implementation details:
 * - Renders a series of dots connected by lines
 * - Colors dots and connecting lines based on progress (completed vs. upcoming)
 * - Shows current step number and total steps
 * - Displays the current step name (with special case for "welcome" → "Get Started")
 * 
 * Opportunities for improvement:
 * 1. Navigation flow:
 *    - This component is purely visual with no navigation control
 *    - Consider extracting navigation logic to a higher-level component or context
 *    - Implement a RecordingFlowProvider that manages transitions between states
 *      and prevents invalid state changes
 * 
 * 2. Customization:
 *    - The `states` prop allows customizing steps but doesn't appear to be used
 *    - Consider removing this flexibility if not needed, or document valid variations
 * 
 * 3. Step labeling:
 *    - Step label display is inconsistent ("welcome" → "Get Started")
 *    - Consider a mapping object for all state labels or a getDisplayLabel function
 *    - Example: { welcome: "Get Started", recording: "Record Your Message", ... }
 * 
 * 4. Accessibility:
 *    - Current implementation lacks proper accessibility attributes
 *    - Consider adding aria-* attributes to identify steps and current progress
 *    - Enhance with keyboard navigation if it becomes interactive
 */
export function ProgressIndicator({
  currentState,
  states = ['welcome', 'recording', 'upload', 'thankyou']
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
                      ? 'bg-wedding-light'
                      : 'bg-wedding-light/30'
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
                    ? 'bg-wedding-light'
                    : 'bg-wedding-light/30'
                  }
                `}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-xs sm:text-sm text-wedding-light/70 font-eb-garamond tracking-wider">
        STEP {states.indexOf(currentState) + 1} OF {states.length}
      </div>

      {/* Step Label - Custom transformation for welcome state */}
      <div className="text-sm sm:text-base font-medium text-wedding-light uppercase tracking-wedding">
        {currentState === 'welcome' ? 'Get Started' : currentState}
      </div>
    </div>
  )
}
