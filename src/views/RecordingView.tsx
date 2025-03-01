import React from 'react';
import { AudioRecorder } from '../components/AudioRecorder';
import { useRecording } from '../context/RecordingContext';

/**
 * Recording view component for capturing audio messages.
 * 
 * This component handles the audio recording phase of the workflow,
 * providing an interface for users to record their message.
 * 
 * Component Flow:
 * 1. Displays audio recorder interface
 * 2. On recording completion:
 *    - Saves audio blob to context
 *    - Navigates to preview screen
 * 3. On cancel:
 *    - Resets flow to welcome screen
 * 
 * @component
 * @returns {React.ReactElement} Recording interface
 */
export function RecordingView(): React.ReactElement {
  const { setAudioBlob, goToNextStep, resetFlow } = useRecording();

  /**
   * Handles completion of audio recording
   * @param {Blob} blob - The recorded audio blob
   */
  const handleRecordingComplete = (blob: Blob): void => {
    setAudioBlob(blob);  // Save blob to context
    goToNextStep();      // Navigate to preview
  };

  return (
    <AudioRecorder
      onRecordingComplete={handleRecordingComplete}
      onCancel={resetFlow}
    />
  );
}
