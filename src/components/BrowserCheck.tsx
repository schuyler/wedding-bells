import { useEffect, useState } from 'react';
import { BrowserCompatibility } from '../types';

/**
 * Props interface for the BrowserCheck component.
 * 
 * @property onCompatibilityChange - Callback function that receives updated browser compatibility information
 */
interface BrowserCheckProps {
  onCompatibilityChange: (compatibility: BrowserCompatibility) => void;
}

/**
 * Browser compatibility verification component.
 * 
 * This simple component performs basic feature detection to ensure the browser 
 * supports the fundamental audio capabilities required by the application. It follows 
 * the principle of doing one thing well by focusing exclusively on feature detection 
 * without handling permissions or other concerns.
 * 
 * Implementation details:
 * - Checks for core Web Audio API and MediaRecorder support
 * - Reports compatibility status through a callback
 * - Shows an error message if browser is not compatible
 * - Returns null (renders nothing) if compatibility checks pass
 * - Intentionally defers permission requests to later components
 * 
 * Design approach:
 * - Simple, focused component with minimal responsibilities
 * - Follows best practice of not requesting permissions until explicitly needed
 * - Uses basic feature detection techniques for compatibility checking
 * - Provides clear user feedback when requirements aren't met
 * 
 * Technical notes:
 * - Sets hasWaveSurferSupport equal to hasAudioSupport as a simplification
 * - This component is currently used in multiple places (App.tsx and WelcomeForm.tsx)
 *   which could lead to redundant checks and confusing architecture
 * 
 * Improvement opportunities:
 * 1. Centralize usage:
 *    - Consider moving this check to a higher-level component or context provider
 *    - Ensure it's only run once at application startup instead of multiple times
 * 
 * 2. Enhance detection:
 *    - Add more specific checks for WaveSurfer.js compatibility if needed
 *    - Consider testing for specific audio format support
 * 
 * 3. Improve error messaging:
 *    - Add more specific guidance based on detected browser
 *    - Provide links to compatible browsers or version requirements
 */
export function BrowserCheck({ onCompatibilityChange }: BrowserCheckProps) {
  const [compatibility, setCompatibility] = useState<BrowserCompatibility>({
    hasAudioSupport: false,
    hasMicrophonePermission: false,
    hasWaveSurferSupport: false,
  });

  useEffect(() => {
    // Only check for basic audio support requirements
    const hasAudioSupport = ('AudioContext' in window || 'webkitAudioContext' in window) && 'MediaRecorder' in window;

    const newCompatibility: BrowserCompatibility = {
      hasAudioSupport,
      hasMicrophonePermission: false, // This will be checked later in AudioRecorder
      hasWaveSurferSupport: hasAudioSupport, // If basic audio is supported, we can use wavesurfer
    };

    setCompatibility(newCompatibility);
    onCompatibilityChange(newCompatibility);
  }, [onCompatibilityChange]);

  if (!compatibility.hasAudioSupport) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <h3 className="text-lg font-medium text-red-800">
          Browser Not Supported
        </h3>
        <p className="mt-2 text-sm text-red-700">
          Your browser does not support audio recording. Please try using a
          modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return null;
}