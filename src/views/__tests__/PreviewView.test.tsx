import { render, screen } from '@testing-library/react';
import { PreviewView } from '../PreviewView';
import { useRecording } from '../../context/RecordingContext';
import { vi } from 'vitest';

// Mock the useRecording hook
vi.mock('../../context/RecordingContext', () => ({
  useRecording: vi.fn(),
}));

describe('PreviewView', () => {
  const mockGoToPreviousStep = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('redirects when audio blob is missing', () => {
    // Mock the useRecording hook to return null for audioBlob
    (useRecording as any).mockReturnValue({
      audioBlob: null,
      goToPreviousStep: mockGoToPreviousStep,
      startUpload: vi.fn(),
      resetFlow: vi.fn(),
    });
    
    render(<PreviewView />);
    
    // Verify that goToPreviousStep was called
    expect(mockGoToPreviousStep).toHaveBeenCalled();
  });
  
  it('does not redirect when audio blob is present', () => {
    // Create a mock audio blob
    const mockAudioBlob = new Blob(['test audio'], { type: 'audio/wav' });
    
    // Mock the useRecording hook to return a valid audioBlob
    (useRecording as any).mockReturnValue({
      audioBlob: mockAudioBlob,
      goToPreviousStep: mockGoToPreviousStep,
      startUpload: vi.fn(),
      resetFlow: vi.fn(),
    });
    
    render(<PreviewView />);
    
    // Verify that goToPreviousStep was not called
    expect(mockGoToPreviousStep).not.toHaveBeenCalled();
    
    // Verify that the preview content is displayed
    expect(screen.getByText(/Preview coming soon/i)).toBeInTheDocument();
  });
});
