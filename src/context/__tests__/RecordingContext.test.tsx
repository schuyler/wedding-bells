import { renderHook, act } from '@testing-library/react';
import { useRecording, RecordingProvider } from '../RecordingContext';
import { BrowserRouter } from 'react-router-dom';

describe('RecordingContext Navigation', () => {
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
  });
});

describe('RecordingContext State Transitions', () => {
  it('updates recording state correctly', () => {
    const { result } = renderHook(() => useRecording(), {
      wrapper: ({ children }) => (
        <BrowserRouter>
          <RecordingProvider>{children}</RecordingProvider>
        </BrowserRouter>
      ),
    });

    act(() => {
      (result.current as any).setIsRecording(true);
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      (result.current as any).setIsRecording(false);
    });

    expect(result.current.isRecording).toBe(false);
  });
});
