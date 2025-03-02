import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AudioRecorder } from '../AudioRecorder'
import { MediaStreamMock } from '../../test/mocks/media-stream.mock'
import { useAudioVolume } from '../../hooks/useAudioRecording'

// Mock hooks and dependencies
vi.mock('../../hooks/useAudioRecording', () => ({
  useAudioVolume: vi.fn().mockReturnValue({
    currentVolume: 0.5,
    error: undefined,
    initializeAnalysis: vi.fn(),
    stopAnalysis: vi.fn()
  })
}))

// Mock child components
vi.mock('../VolumeIndicator', () => ({
  VolumeIndicator: () => <div data-testid="volume-indicator" />
}))

vi.mock('../CountdownTimer', () => ({
  CountdownTimer: ({ 
    onComplete 
  }: { 
    duration: number
    running: boolean
    onComplete: () => void 
  }) => (
    <div data-testid="countdown-timer">
      <button data-testid="trigger-countdown-complete" onClick={onComplete}>
        Complete Countdown
      </button>
    </div>
  )
}))

vi.mock('../ErrorModal', () => ({
  ErrorModal: ({ 
    isOpen, 
    title, 
    description,
    action,
    onClose
  }: { 
    isOpen: boolean
    title: string
    description: string
    action?: { label: string; onClick: () => void }
    onClose: () => void
  }) => isOpen ? (
    <div data-testid="error-modal">
      <div>{title}</div>
      <div>{description}</div>
      {action && (
        <button 
          data-testid="error-action-button" 
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
      <button data-testid="error-close-button" onClick={onClose}>Close</button>
    </div>
  ) : null
}))

// Mock WaveformVisualizer with recording state management
vi.mock('../WaveformVisualizer', () => ({
  WaveformVisualizer: vi.fn().mockImplementation(({ 
    ref, 
    onRecordingComplete, 
    onRecordingStart,
    onRecordingPause,
    onRecordingResume 
  }) => {
    if (ref) {
      ref.current = {
        startRecording: vi.fn().mockImplementation(async () => {
          onRecordingStart?.()
        }),
        stopRecording: vi.fn().mockImplementation(() => {
          const mockBlob = new Blob(['test audio'], { type: 'audio/webm' })
          onRecordingComplete?.(mockBlob)
        }),
        pauseRecording: vi.fn().mockImplementation(() => {
          onRecordingPause?.()
        }),
        resumeRecording: vi.fn().mockImplementation(() => {
          onRecordingResume?.()
        })
      }
    }
    return <div data-testid="waveform-visualizer" />
  })
}))

describe('AudioRecorder', () => {
  const mockUserMedia = vi.fn()
  const mockOnRecordingComplete = vi.fn()
  const mockOnCancel = vi.fn()
  let mockInitializeAnalysis: any
  let mockStopAnalysis: any
  
  beforeEach(() => {
    // Mock getUserMedia
    mockUserMedia.mockResolvedValue(new MediaStreamMock())
    
    // Setup navigator.mediaDevices mock
    Object.defineProperty(window.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockUserMedia
      },
    })

    // Create mocks for useAudioVolume
    mockInitializeAnalysis = vi.fn()
    mockStopAnalysis = vi.fn()
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0.5,
      error: undefined,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })

  // Test initial rendering
  it('renders without crashing', () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    expect(screen.getByText('Ready to Record')).toBeInTheDocument()
    expect(screen.getByText('Click start when you are ready')).toBeInTheDocument()
  })

  // Test permission handling
  it('requests microphone permissions when start recording is clicked', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    expect(mockUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
      }
    })
  })

  it('shows permission denied UI when access is denied', async () => {
    // Mock permission denial with explicit NotAllowedError name
    const notAllowedError = new Error('Permission denied')
    notAllowedError.name = 'NotAllowedError'
    mockUserMedia.mockRejectedValueOnce(notAllowedError)
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    // Verify permission denied UI elements
    const heading = screen.getByText('Microphone Access Denied')
    expect(heading).toHaveClass('text-lg', 'font-medium', 'text-red-800')
    
    const container = heading.closest('div')
    expect(container).toHaveClass('rounded-lg', 'bg-red-50', 'border-red-200')
    
    expect(screen.getByText(/microphone access is required/i)).toBeInTheDocument()
  })

  it('shows error modal for non-permission errors', async () => {
    // Mock a different kind of error
    mockUserMedia.mockRejectedValueOnce(new Error('DeviceNotFoundError'))
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    // Find error modal by test id and verify its contents
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('DeviceNotFoundError')
  })

  // Test cancel functionality
  it('calls onCancel when cancel button is clicked', () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('calls onCancel when cancel is clicked in permission denied state', async () => {
    mockUserMedia.mockRejectedValueOnce(new Error('NotAllowedError'))
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  // Test recording state management
  it('handles full recording flow: start -> stop -> complete', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Verify recording in progress state
    expect(screen.getByText('Recording in Progress')).toBeInTheDocument()
    expect(screen.getByText('Speak clearly into your microphone')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
    expect(screen.getByTestId('volume-indicator')).toBeInTheDocument()

    // Finish recording
    await act(async () => {
      fireEvent.click(screen.getByText('Finish Recording'))
    })

    // Verify recording complete callback
    expect(mockOnRecordingComplete).toHaveBeenCalledWith(
      expect.any(Blob)
    )
    expect(mockOnRecordingComplete.mock.calls[0][0].type).toBe('audio/webm')
  })

  it('handles pause and resume functionality', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Pause recording
    fireEvent.click(screen.getByText('Pause'))
    expect(screen.getByText('Recording paused')).toBeInTheDocument()

    // Resume recording
    fireEvent.click(screen.getByText('Resume'))
    expect(screen.getByText('Speak clearly into your microphone')).toBeInTheDocument()
  })

  // Test cleanup and resource management
  it('cleans up audio resources on unmount', async () => {
    const { unmount } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Unmount should trigger cleanup
    unmount()
    expect(mockStopAnalysis).toHaveBeenCalled()
  })

  it('manages volume analysis state correctly', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording should initialize analysis
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    expect(mockInitializeAnalysis).toHaveBeenCalled()

    // Pause should stop analysis
    fireEvent.click(screen.getByText('Pause'))
    expect(mockStopAnalysis).toHaveBeenCalled()

    // Resume should reinitialize analysis
    mockStopAnalysis.mockClear()
    mockInitializeAnalysis.mockClear()

    // Mock getUserMedia to return a new MediaStreamMock
    mockUserMedia.mockResolvedValueOnce(new MediaStreamMock())
    await act(async () => {
      fireEvent.click(screen.getByText('Resume'))
    })
    expect(mockInitializeAnalysis).toHaveBeenCalledWith(expect.any(MediaStreamMock))

    // Stop recording should stop analysis
    mockStopAnalysis.mockClear()
    fireEvent.click(screen.getByText('Finish Recording'))
    expect(mockStopAnalysis).toHaveBeenCalled()
  })

  // Additional tests to improve coverage

  // Test for non-permission errors in requestMicrophoneAccess (lines 131-139)
  it('handles generic errors during microphone access request', async () => {
    // Mock a generic error without NotAllowedError name
    const genericError = new Error('Unknown error occurred')
    mockUserMedia.mockRejectedValueOnce(genericError)
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    // Verify error modal shows with correct message
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('Unknown error occurred')
  })

  // Test for error handling in handleRecordingResume (lines 188-195)
  it('handles permission errors during recording resume', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Pause recording
    fireEvent.click(screen.getByText('Pause'))
    
    // Mock permission error on resume
    const notAllowedError = new Error('Permission denied')
    notAllowedError.name = 'NotAllowedError'
    mockUserMedia.mockRejectedValueOnce(notAllowedError)
    
    // Resume recording
    await act(async () => {
      fireEvent.click(screen.getByText('Resume'))
    })
    
    // Should show permission denied UI
    expect(screen.getByText('Microphone Access Denied')).toBeInTheDocument()
  })

  it('handles generic errors during recording resume', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Pause recording
    fireEvent.click(screen.getByText('Pause'))
    
    // Mock generic error on resume
    const genericError = new Error('Device disconnected')
    mockUserMedia.mockRejectedValueOnce(genericError)
    
    // Resume recording
    await act(async () => {
      fireEvent.click(screen.getByText('Resume'))
    })
    
    // Should show error modal
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('Device disconnected')
    
    // Should remain in paused state
    expect(screen.getByText('Recording paused')).toBeInTheDocument()
  })

  // Test for volume error synchronization (line 218)
  it('synchronizes volume analysis errors with component error state', async () => {
    // Setup volume error
    const volumeError = new Error('Volume analysis error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: volumeError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Error should be displayed in modal
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('Volume analysis error')
  })

  // Test for error modal retry functionality
  it('allows retrying after an error occurs', async () => {
    // Setup with initial error
    const volumeError = new Error('Volume analysis error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: volumeError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    const { rerender } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Verify error modal is shown
    expect(screen.getByTestId('error-modal')).toBeInTheDocument()
    
    // Clear the error for next render
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0.5,
      error: undefined,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    // Click try again button
    fireEvent.click(screen.getByTestId('error-action-button'))
    
    // Force a rerender with the new mock
    rerender(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Error modal should be closed
    expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument()
  })

  // Test for error retry in paused state
  it('allows retrying from error while recording is paused', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Pause recording
    fireEvent.click(screen.getByText('Pause'))
    expect(screen.getByText('Recording paused')).toBeInTheDocument()
    
    // Simulate an error while paused
    const deviceError = new Error('Device error while paused')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: deviceError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    // Force a rerender to show the error
    const { rerender } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Verify error modal is shown
    expect(screen.getByTestId('error-modal')).toBeInTheDocument()
    
    // Clear the error and prepare for resume
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0.5,
      error: undefined,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    // Mock getUserMedia to return a new MediaStreamMock for resume
    mockUserMedia.mockResolvedValueOnce(new MediaStreamMock())
    
    // Click try again button - should call handleRecordingResume
    await act(async () => {
      fireEvent.click(screen.getByTestId('error-action-button'))
    })
    
    // Should have called initializeAnalysis for resume
    expect(mockInitializeAnalysis).toHaveBeenCalled()
    
    // Should be back in recording state
    expect(screen.getByText('Speak clearly into your microphone')).toBeInTheDocument()
  })

  // Test for non-permission error during recording start
  it('handles non-permission errors during recording start', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Mock a device error (not a permission error)
    const deviceError = new Error('Device in use by another application')
    mockUserMedia.mockRejectedValueOnce(deviceError)
    
    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    // Should show error modal
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('Device in use by another application')
    
    // Should not be in recording state
    expect(screen.queryByText('Recording in Progress')).not.toBeInTheDocument()
    
    // Should have called setIsRecording(false)
    expect(screen.getByText('Ready to Record')).toBeInTheDocument()
  })

  // Test for non-Error object during recording start
  it('handles non-Error objects during recording start', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Mock a non-Error object rejection
    mockUserMedia.mockRejectedValueOnce('String error message')
    
    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })
    
    // Should show error modal with generic message
    const errorModal = screen.getByTestId('error-modal')
    expect(errorModal).toHaveTextContent('Recording Error')
    expect(errorModal).toHaveTextContent('Failed to access microphone. Please check your settings and try again.')
    
    // Should not be in recording state
    expect(screen.queryByText('Recording in Progress')).not.toBeInTheDocument()
  })

  // Test for error retry in initial state
  it('allows retrying from error in initial state', async () => {
    // Setup with initial error
    const initialError = new Error('Initial error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: initialError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    const { rerender } = render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Verify error modal is shown
    expect(screen.getByTestId('error-modal')).toBeInTheDocument()
    
    // Clear the error and prepare for start
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0.5,
      error: undefined,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    // Mock getUserMedia to return a new MediaStreamMock for start
    mockUserMedia.mockResolvedValueOnce(new MediaStreamMock())
    
    // Click try again button - should call handleRecordingStart
    await act(async () => {
      fireEvent.click(screen.getByTestId('error-action-button'))
    })
    
    // Should be in recording state
    expect(screen.getByText('Recording in Progress')).toBeInTheDocument()
    expect(screen.getByText('Speak clearly into your microphone')).toBeInTheDocument()
  })

  // Test for error modal close functionality
  it('allows closing the error modal', async () => {
    // Setup with initial error
    const volumeError = new Error('Volume analysis error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: volumeError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis
    })
    
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )
    
    // Click close button
    fireEvent.click(screen.getByTestId('error-close-button'))
    
    // Error modal should be closed
    expect(screen.queryByTestId('error-modal')).not.toBeInTheDocument()
  })

  // Test for countdown timer completion
  it('stops recording when countdown timer completes', async () => {
    render(
      <AudioRecorder 
        onRecordingComplete={mockOnRecordingComplete} 
        onCancel={mockOnCancel} 
      />
    )

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByText('Start Recording'))
    })

    // Trigger countdown completion
    fireEvent.click(screen.getByTestId('trigger-countdown-complete'))
    
    // Should have called onRecordingComplete
    expect(mockOnRecordingComplete).toHaveBeenCalled()
  })
})
