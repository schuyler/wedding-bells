import { UploadProgress } from '../components/UploadProgress';

/**
 * Props for the UploadView component
 * @interface UploadViewProps
 * @property {string} fileName - Name of the file being uploaded
 * @property {number} progress - Current upload progress percentage (0-100)
 * @property {'uploading' | 'completed'} status - Current upload status
 * @property {() => void} onComplete - Callback fired when upload completes
 */
interface UploadViewProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed';
  onComplete: () => void;
}

/**
 * Upload view component handling file upload progress visualization.
 * 
 * This component is responsible for displaying upload progress and status
 * for the recorded audio message. It's a pure refactor from App.tsx upload state.
 * 
 * Component Flow:
 * 1. Displays file name and upload progress
 * 2. Updates progress bar in real-time
 * 3. Triggers completion callback when upload finishes
 * 
 * @component
 * @param {UploadViewProps} props - Component props
 * @returns {JSX.Element} Upload progress interface
 * 
 * Technical Architecture:
 * - Implements view layer of upload state
 * - Uses UploadProgress component for visualization
 * - Pure presentational component (logic handled by parent)
 */
export function UploadView({ fileName, progress, status, onComplete }: UploadViewProps) {
  return (
    <UploadProgress
      fileName={fileName}
      progress={progress}
      status={status}
      onComplete={onComplete}
    />
  );
}
