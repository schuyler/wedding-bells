import { renderHook, act } from '@testing-library/react';
import { useRecording, RecordingProvider } from '../RecordingContext';
import { BrowserRouter, useNavigate } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RecordingContext Navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('follows linear navigation flow', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('recording');
    expect(mockNavigate).toHaveBeenCalledWith('/recording');

    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('preview');
    expect(mockNavigate).toHaveBeenCalledWith('/preview');

    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('upload');
    expect(mockNavigate).toHaveBeenCalledWith('/upload');

    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('thankyou');
    expect(mockNavigate).toHaveBeenCalledWith('/thankyou');

    // Attempt to navigate past the last step
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('thankyou'); // Should remain at thank-you
    expect(mockNavigate).toHaveBeenCalledTimes(4); // No additional navigation
  });

  it('restricts invalid transitions', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    // Check that you can't go backward from the first step
    act(() => {
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe('welcome');
    expect(mockNavigate).not.toHaveBeenCalled();

    // Try to go backward again
    act(() => {
      result.current.goToPreviousStep();
    });
    expect(result.current.currentStep).toBe('welcome');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles startUpload navigation', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    // Create audio blob and navigate to upload
    const audioBlob = new Blob(['test audio'], { type: 'audio/wav' });
    act(() => {
      result.current.setAudioBlob(audioBlob);
      result.current.setGuestInfo({ name: 'Test', email: 'test@example.com' });
      result.current.startUpload();
    });

    expect(result.current.currentStep).toBe('thankyou');
    expect(mockNavigate).toHaveBeenCalledWith('/thankyou');
  });

  it('resets flow state correctly', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    // Set up some state
    act(() => {
      result.current.setGuestInfo({ name: 'Test', email: 'test@example.com' });
      result.current.setIsRecording(true);
      result.current.goToNextStep();
    });

    // Reset the flow
    act(() => {
      result.current.resetFlow();
    });

    // Verify all state is reset
    expect(result.current.currentStep).toBe('welcome');
    expect(result.current.guestInfo).toBeNull();
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(mockNavigate).toHaveBeenLastCalledWith('/welcome');
  });

  it('validates required state for transitions', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    // Go to recording without guest info
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('recording');

    // Try to go to preview without audio
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('preview');

    // Set up required state
    act(() => {
      result.current.setAudioBlob(new Blob(['test'], { type: 'audio/wav' }));
    });

    // Now we can proceed
    act(() => {
      result.current.goToNextStep();
    });
    expect(result.current.currentStep).toBe('upload');
  });
});

describe('RecordingContext State Transitions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('updates recording state correctly', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);

    act(() => {
      result.current.setIsRecording(true);
    });
    expect(result.current.isRecording).toBe(true);
    expect(result.current.isPaused).toBe(false); // Starting recording should ensure not paused

    act(() => {
      result.current.setIsRecording(false);
    });
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false); // Stopping recording should ensure not paused
  });

  it('handles guest info updates', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    const guestInfo = { name: 'Test User', email: 'test@example.com' };
    act(() => {
      result.current.setGuestInfo(guestInfo);
    });
    expect(result.current.guestInfo).toEqual(guestInfo);
  });

  it('handles audio blob updates', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    const audioBlob = new Blob(['test audio'], { type: 'audio/wav' });
    act(() => {
      result.current.setAudioBlob(audioBlob);
    });
    expect(result.current.audioBlob).toBe(audioBlob);
  });
});

describe('RecordingContext Error Handling', () => {
  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useRecording());
    }).toThrow('useRecording must be used within RecordingProvider');
  });

  it('maintains state on invalid transitions', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    const initialStep = result.current.currentStep;

    // Try invalid navigation
    act(() => {
      result.current.goToPreviousStep();
    });

    expect(result.current.currentStep).toBe(initialStep); // State should not change
    expect(mockNavigate).not.toHaveBeenCalled(); // No navigation should occur
  });
});
