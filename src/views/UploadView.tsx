import { useEffect } from 'react';
import { UploadProgress } from '../components/UploadProgress';
import { useRecording } from '../context/RecordingContext';

/**
 * Upload view component handling file upload progress visualization.
 * 
 * This component is responsible for displaying upload progress and status
 * for the recorded audio message.
 * 
 * Component Flow:
 * 1. Automatically starts upload when component mounts
 * 2. Displays file name and upload progress
 * 3. Updates progress bar in real-time
 * 4. Handles errors and retry functionality
 * 5. Triggers completion when upload finishes
 */
export function UploadView() {
  const { 
    guestInfo, 
    goToNextStep, 
    uploadProgress, 
    uploadStatus, 
    uploadError,
    startUpload,
    retryUpload
  } = useRecording();
  
  // Start upload when component mounts
  useEffect(() => {
    if (uploadStatus === 'idle') {
      startUpload().catch(error => {
        // Error handling is done in RecordingContext
        console.error('Upload failed in UploadView:', error);
      });
    }
  }, [uploadStatus, startUpload]);

  return (
    <UploadProgress
      fileName={guestInfo ? `${guestInfo.name}'s Message.wav` : 'Recording.wav'}
      progress={uploadProgress}
      status={uploadStatus}
      error={uploadError || undefined}
      onRetry={() => retryUpload()}
      onComplete={goToNextStep}
    />
  );
}
