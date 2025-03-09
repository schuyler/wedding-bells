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

  // Extract retryAttempt from uploadState if available
  const { uploadState } = useRecording();
  const retryAttempt = uploadState?.retryAttempt;
    
  // Auto-advance to next step when upload completes
  useEffect(() => {
    if (uploadStatus === 'completed') {
      goToNextStep();
    }
  }, [uploadStatus, goToNextStep]);

  return (
    <UploadProgress
      progress={uploadProgress}
      status={uploadStatus}
      error={uploadError || undefined}
      onRetry={() => retryUpload()}
      retryAttempt={retryAttempt}
    />
  );
}
