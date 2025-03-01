import { ThankYou } from '../components/ThankYou';

/**
 * Props for the ThankYouView component
 * @interface ThankYouViewProps
 * @property {string} guestName - Name of the guest who recorded the message
 * @property {() => void} onRecordAnother - Callback to start another recording
 */
interface ThankYouViewProps {
  guestName: string;
  onRecordAnother: () => void;
}

/**
 * Thank you view component displayed after successful message upload.
 * 
 * This component provides confirmation and next steps after a guest
 * completes their recording. It's a pure refactor from App.tsx thankyou state.
 * 
 * Component Flow:
 * 1. Displays personalized thank you message
 * 2. Offers option to record another message
 * 
 * @component
 * @param {ThankYouViewProps} props - Component props
 * @returns {JSX.Element} Thank you interface
 * 
 * Technical Architecture:
 * - Implements view layer of thankyou state
 * - Uses ThankYou component for presentation
 * - Pure presentational component (logic handled by parent)
 * 
 * User Experience:
 * - Provides clear completion feedback
 * - Enables multiple recording workflow
 * - Personalizes message with guest name
 */
export function ThankYouView({ guestName, onRecordAnother }: ThankYouViewProps) {
  return (
    <ThankYou
      guestName={guestName}
      onRecordAnother={onRecordAnother}
    />
  );
}
