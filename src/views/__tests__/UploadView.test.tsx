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
  UploadProgress: ({ 
    fileName, 
    progress, 
    status, 
    error, 
    onRetry, 
    onComplete 
  }: { 
    fileName: string, 
    progress: number,
    status: string,
    error?: string,
    onRetry?: () => void,
    onComplete?: () => void 
  }) => (
    <div data-testid="upload-progress">
      <div data-testid="file-name">{fileName}</div>
      <div data-testid="progress">{progress}</div>
      <div data-testid="status">{status}</div>
      {error && <div data-testid="error">{error}</div>}
      {status === 'error' && onRetry && <button onClick={onRetry}>Retry</button>}
      {status === 'completed' && <button onClick={onComplete}>Complete</button>}
    </div>
  ),
}));

describe('UploadView', () => {
  const mockStartUpload = vi.fn().mockResolvedValue(undefined);
  const mockRetryUpload = vi.fn().mockResolvedValue(undefined);
  const mockGoToNextStep = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User' },
      uploadProgress: 0,
      uploadStatus: 'idle',
      uploadError: null,
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      goToNextStep: mockGoToNextStep
    });
  });
  
  it('automatically starts upload when mounted', () => {
    render(<UploadView />);
    
    // Verify that startUpload was called
    expect(mockStartUpload).toHaveBeenCalledTimes(1);
  });
  
  it('uses guest name for file name when available', () => {
    render(<UploadView />);
    
    // Verify that the file name includes the guest name
    expect(screen.getByTestId('file-name').textContent).toBe("Test User's Message.wav");
  });
  
  it('uses default file name when guest info is missing', () => {
    // Mock the useRecording hook without guest info
    (useRecording as any).mockReturnValue({
      guestInfo: null,
      uploadProgress: 0,
      uploadStatus: 'idle',
      uploadError: null,
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      goToNextStep: mockGoToNextStep
    });
    
    render(<UploadView />);
    
    // Verify that the default file name is used
    expect(screen.getByTestId('file-name').textContent).toBe('Recording.wav');
  });
  
  it('displays the current upload status and progress', () => {
    // Mock the useRecording hook with uploading state
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User' },
      uploadProgress: 65,
      uploadStatus: 'uploading',
      uploadError: null,
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      goToNextStep: mockGoToNextStep
    });
    
    render(<UploadView />);
    
    // Verify that status and progress are displayed
    expect(screen.getByTestId('status').textContent).toBe('uploading');
    expect(screen.getByTestId('progress').textContent).toBe('65');
  });
  
  it('handles upload errors and provides retry functionality', () => {
    // Mock the useRecording hook with error state
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User' },
      uploadProgress: 50,
      uploadStatus: 'error',
      uploadError: 'Upload failed',
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      goToNextStep: mockGoToNextStep
    });
    
    render(<UploadView />);
    
    // Verify error is displayed
    expect(screen.getByTestId('error').textContent).toBe('Upload failed');
    
    // Test retry functionality
    screen.getByText('Retry').click();
    expect(mockRetryUpload).toHaveBeenCalledTimes(1);
  });
  
  it('navigates to next step on upload completion', () => {
    // Mock the useRecording hook with completed state
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User' },
      uploadProgress: 100,
      uploadStatus: 'completed',
      uploadError: null,
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      goToNextStep: mockGoToNextStep
    });
    
    render(<UploadView />);
    
    // Simulate upload completion
    screen.getByText('Complete').click();
    
    // Verify that goToNextStep was called
    expect(mockGoToNextStep).toHaveBeenCalled();
  });
});
