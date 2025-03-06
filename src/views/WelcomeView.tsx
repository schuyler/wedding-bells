import React from 'react';
import { WelcomeForm } from '../components/WelcomeForm';

/**
 * Props for the WelcomeView component
 * @interface WelcomeViewProps
 * @property {(guestInfo: { name: string }) => void} onSubmit - Callback fired when guest info is submitted
 */
import { useRecording } from '../context/RecordingContext';

/**
 * Welcome view component for collecting initial guest information.
 * 
 * This component serves as the entry point of the wedding message recording workflow,
 * collecting guest information before proceeding to recording.
 * 
 * Component Flow:
 * 1. Displays welcome form interface
 * 2. Collects guest name
 * 3. Uses context to manage state and navigation
 */
export function WelcomeView(): React.ReactElement {
  const { setGuestInfo, goToNextStep, guestInfo } = useRecording();
  const handleSubmit = (info: { name: string }) => {
    setGuestInfo({ name: info.name, email: '' });
    goToNextStep();
  };
  return <WelcomeForm 
    onSubmit={handleSubmit} 
    defaultValues={guestInfo || undefined} 
  />;
}
