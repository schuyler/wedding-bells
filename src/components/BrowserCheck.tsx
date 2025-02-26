import { useEffect, useState } from 'react';
import { BrowserCompatibility } from '../types';

interface BrowserCheckProps {
  onCompatibilityChange: (compatibility: BrowserCompatibility) => void;
}

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
