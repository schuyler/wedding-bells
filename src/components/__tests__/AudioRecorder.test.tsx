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
  CountdownTimer: () => <div data-testid="countdown-timer" />
}))

vi.mock('../ErrorModal', () => ({
  ErrorModal: ({ 
    isOpen, 
    title, 
    description 
  }: { 
    isOpen: boolean
    title: string
    description: string
    action?: { label: string; onClick: () => void }
    onClose: () => void
  }) => isOpen ? <div data-testid="error-modal">{title}{description}</div> : null
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
})
