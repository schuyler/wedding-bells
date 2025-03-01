import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export type RecordingState = 'welcome' | 'recording' | 'preview' | 'upload' | 'thankyou';
export type GuestInfo = { name: string; email: string };

interface RecordingContextType {
  currentStep: RecordingState;
  guestInfo: GuestInfo | null;
  audioBlob: Blob | null;
  isRecording: boolean;
  isPaused: boolean;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setGuestInfo: (info: GuestInfo) => void;
  startUpload: () => void;
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

  const STEPS: RecordingState[] = ['welcome', 'recording', 'preview', 'upload', 'thankyou'];

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

  const startUpload = useCallback(() => {
    setCurrentStep('thankyou');
    navigate('/thankyou');
  }, [navigate]);

  const resetFlow = useCallback(() => {
    setCurrentStep('welcome');
    setGuestInfo(null);
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    navigate('/welcome');
  }, [navigate]);

  return (
    <RecordingContext.Provider value={{
      currentStep,
      guestInfo,
      audioBlob,
      isRecording,
      isPaused,
      goToNextStep,
      goToPreviousStep,
      setGuestInfo,
      startUpload,
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
