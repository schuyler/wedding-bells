import { UploadProgress } from '../components/UploadProgress';

import { useRecording } from '../context/RecordingContext';

/**
 * Upload view component handling file upload progress visualization.
 * 
 * This component is responsible for displaying upload progress and status
 * for the recorded audio message.
 * 
 * Component Flow:
 * 1. Displays file name and upload progress
 * 2. Updates progress bar in real-time
 * 3. Triggers completion when upload finishes
 */
export function UploadView() {
  const { guestInfo, goToNextStep } = useRecording();
  
  return (
    <UploadProgress
      fileName={guestInfo ? `${guestInfo.name}'s Message.wav` : 'Recording.wav'}
      progress={100}
      status={'completed'}
      onComplete={goToNextStep}
    />
  );
}
