import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '../hooks/useUpload';

export type RecordingState = 'welcome' | 'recording' | 'upload' | 'thankyou';
export type GuestInfo = { name: string };
export type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error';

interface RecordingContextType {
  currentStep: RecordingState;
  guestInfo: GuestInfo | null;
  audioBlob: Blob | null;
  isRecording: boolean;
  isPaused: boolean;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  uploadError: string | null;
  uploadState: { 
    status: UploadStatus; 
    progress: number; 
    error?: Error;
    retryAttempt?: number;
  };
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setGuestInfo: (info: GuestInfo) => void;
  setAudioBlob: (blob: Blob) => void;
  setIsRecording: (value: boolean) => void;
  startUpload: () => Promise<void>;
  retryUpload: () => Promise<void>;
  resetFlow: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<RecordingState>('welcome');
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  
  // Use our upload hook for managing upload state
  const { 
    uploadState, 
    startUpload: initiateUpload, 
    retryUpload: initiateRetryUpload 
  } = useUpload();

  const STEPS: RecordingState[] = ['welcome', 'recording', 'upload', 'thankyou'];

  const goToNextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
      navigate(`/${STEPS[currentIndex + 1]}`);
    }
  }, [currentStep, navigate]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
      navigate(`/${STEPS[currentIndex - 1]}`);
    }
  }, [currentStep, navigate]);

  const startUpload = useCallback(async () => {
    if (!audioBlob || !guestInfo) {
      return Promise.reject(new Error('No recording or guest information available'));
    }
    
    try {
      // Create a file object with the correct name based on the MIME type
      let fileExtension = 'webm';
      if (audioBlob.type.includes('mp4')) {
        fileExtension = 'm4a'; // Safari uses MP4 container for audio
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = 'wav';
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = 'ogg';
      }
      const fileName = `${guestInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
      
      // Get approximate recording duration (if we've tracked it elsewhere)
      // This would be more accurate if we tracked it during recording
      let duration = 0;
      if ('duration' in audioBlob) {
        duration = (audioBlob as any).duration || 0;
      }
      
      // Create metadata for the upload
      const metadata = {
        guestName: guestInfo.name,
        timestamp: new Date().toISOString(),
        duration: duration,
        originalFilename: fileName
      };
      
      // Start the upload
      const result = await initiateUpload(audioBlob, metadata);
      console.log('Upload successful:', result);
      
      // On success, go to next step (this only executes if upload doesn't reject)
      goToNextStep();
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is already handled in the hook
    }
  }, [audioBlob, guestInfo, initiateUpload, goToNextStep]);

  const retryUpload = useCallback(async () => {
    if (!audioBlob || !guestInfo) {
      return Promise.reject(new Error('No recording or guest information available'));
    }
    
    try {
      // Create a file object with the correct name based on the MIME type
      let fileExtension = 'webm';
      if (audioBlob.type.includes('mp4')) {
        fileExtension = 'm4a'; // Safari uses MP4 container for audio
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = 'wav';
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = 'ogg';
      }
      const fileName = `${guestInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
      
      // Get approximate recording duration (if we've tracked it elsewhere)
      let duration = 0;
      if ('duration' in audioBlob) {
        duration = (audioBlob as any).duration || 0;
      }
      
      // Create metadata for the upload
      const metadata = {
        guestName: guestInfo.name,
        timestamp: new Date().toISOString(),
        duration: duration,
        originalFilename: fileName
      };
      
      // Retry the upload
      const result = await initiateRetryUpload(audioBlob, metadata);
      console.log('Upload retry successful:', result);
      
      // On success, go to next step
      goToNextStep();
    } catch (error) {
      console.error('Upload retry failed:', error);
      // Error is already handled in the hook
    }
  }, [audioBlob, guestInfo, initiateRetryUpload, goToNextStep]);

  const resetFlow = useCallback(() => {
    setCurrentStep('welcome');
    // Preserve guest info when returning to welcome screen
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    navigate('/welcome');
  }, [navigate]);

  // Extract relevant states from uploadState
  const uploadProgress = uploadState.progress;
  const uploadStatus = uploadState.status;
  const uploadError = uploadState.error ? uploadState.error.message : null;

  return (
    <RecordingContext.Provider value={{
      currentStep,
      guestInfo,
      audioBlob,
      isRecording,
      isPaused,
      uploadProgress,
      uploadStatus,
      uploadError,
      uploadState, // Add the complete uploadState object
      goToNextStep,
      goToPreviousStep,
      setGuestInfo,
      setAudioBlob,
      setIsRecording,
      startUpload,
      retryUpload,
      resetFlow
    }}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) throw new Error('useRecording must be used within RecordingProvider');
  return context;
};
