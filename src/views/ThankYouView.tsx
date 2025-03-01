import { ThankYou } from '../components/ThankYou';
import { useRecording } from '../context/RecordingContext';

/**
 * Thank you view component displayed after successful message upload.
 * 
 * This component provides confirmation and next steps after a guest
 * completes their recording.
 * 
 * Component Flow:
 * 1. Displays personalized thank you message
 * 2. Offers option to record another message
 */
export function ThankYouView() {
  const { guestInfo, resetFlow } = useRecording();
  
  return (
    <ThankYou
      guestName={guestInfo?.name || ''}
      onRecordAnother={resetFlow}
    />
  );
}
