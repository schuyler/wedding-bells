import React, { useEffect } from 'react';
import { useRecording } from '../context/RecordingContext';

/**
 * Preview view component for reviewing recorded audio message.
 * 
 * This component provides an interface for users to review their recording
 * before proceeding to upload. It integrates with RecordingContext for
 * state management and navigation.
 * 
 * Component Flow:
 * 1. Validates required audio blob is present
 * 2. Displays preview placeholder
 * 3. Offers continue/cancel options using context navigation
 * 
 * @component
 * @returns {React.ReactElement} Preview interface
 * 
 * Technical Architecture:
 * - Uses RecordingContext for state and navigation
 * - Implements standard validation pattern
 * - Pure presentational component
 * 
 * Technical Debt:
 * - Preview functionality coming in Phase 3
 * - Currently shows placeholder message
 */
export function PreviewView(): React.ReactElement {
  const { audioBlob, startUpload, resetFlow, goToPreviousStep } = useRecording();
  
  // Redirect if no audio blob
  useEffect(() => {
    if (!audioBlob) {
      goToPreviousStep();
    }
  }, [audioBlob, goToPreviousStep]);

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600">
        Preview coming soon...
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={startUpload}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Continue
        </button>
        <button
          onClick={resetFlow}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
