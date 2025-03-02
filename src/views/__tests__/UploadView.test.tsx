import { render, screen } from '@testing-library/react';
import { UploadView } from '../UploadView';
import { useRecording } from '../../context/RecordingContext';
import { vi } from 'vitest';

// Mock the useRecording hook
vi.mock('../../context/RecordingContext', () => ({
  useRecording: vi.fn(),
}));

// Mock the UploadProgress component
vi.mock('../../components/UploadProgress', () => ({
  UploadProgress: ({ fileName, onComplete }: { fileName: string, onComplete: () => void }) => (
    <div data-testid="upload-progress">
      <div data-testid="file-name">{fileName}</div>
      <button onClick={onComplete}>Complete</button>
    </div>
  ),
}));

describe('UploadView', () => {
  const mockGoToNextStep = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('uses guest name for file name when available', () => {
    // Mock the useRecording hook with guest info
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User', email: 'test@example.com' },
      goToNextStep: mockGoToNextStep,
    });
    
    render(<UploadView />);
    
    // Verify that the file name includes the guest name
    expect(screen.getByTestId('file-name').textContent).toBe("Test User's Message.wav");
  });
  
  it('uses default file name when guest info is missing', () => {
    // Mock the useRecording hook without guest info
    (useRecording as any).mockReturnValue({
      guestInfo: null,
      goToNextStep: mockGoToNextStep,
    });
    
    render(<UploadView />);
    
    // Verify that the default file name is used
    expect(screen.getByTestId('file-name').textContent).toBe('Recording.wav');
  });
  
  it('navigates to next step on upload completion', () => {
    // Mock the useRecording hook
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User', email: 'test@example.com' },
      goToNextStep: mockGoToNextStep,
    });
    
    render(<UploadView />);
    
    // Simulate upload completion
    screen.getByText('Complete').click();
    
    // Verify that goToNextStep was called
    expect(mockGoToNextStep).toHaveBeenCalled();
  });
});
