import { render, screen } from '@testing-library/react';
import { RecordingView } from '../RecordingView';
import { useRecording } from '../../context/RecordingContext';
import { vi } from 'vitest';

// Mock the useRecording hook
vi.mock('../../context/RecordingContext', () => ({
  useRecording: vi.fn(),
}));

// Mock the AudioRecorder component
vi.mock('../../components/AudioRecorder', () => ({
  AudioRecorder: ({ onRecordingComplete, onCancel }: {
    onRecordingComplete: (blob: Blob) => void
    onCancel: () => void
  }) => (
    <div>
      <button onClick={() => onRecordingComplete(new Blob(['test audio'], { type: 'audio/wav' }))}>
        Record Message
      </button>
      <button onClick={onCancel}>Cancel Recording</button>
    </div>
  ),
}));

describe('RecordingView', () => {
  const mockSetAudioBlob = vi.fn();
  const mockGoToNextStep = vi.fn();
  const mockResetFlow = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useRecording hook
    (useRecording as any).mockReturnValue({
      setAudioBlob: mockSetAudioBlob,
      goToNextStep: mockGoToNextStep,
      resetFlow: mockResetFlow,
    });
  });

  it('renders recording interface', () => {
    render(<RecordingView />);
    expect(screen.getByText('Record Message')).toBeInTheDocument();
    expect(screen.getByText('Cancel Recording')).toBeInTheDocument();
  });

  it('handles recording completion', () => {
    render(<RecordingView />);
    
    // Complete recording
    screen.getByText('Record Message').click();
    
    // Verify blob is saved and navigation occurs
    expect(mockSetAudioBlob).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockGoToNextStep).toHaveBeenCalled();
  });

  it('handles recording cancellation', () => {
    render(<RecordingView />);
    
    // Cancel recording
    screen.getByText('Cancel Recording').click();
    
    // Verify flow reset
    expect(mockResetFlow).toHaveBeenCalled();
  });
});
