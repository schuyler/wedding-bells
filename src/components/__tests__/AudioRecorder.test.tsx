import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { DEV: false } } })
import React, { forwardRef, useImperativeHandle } from 'react'

// Standard debug values object for reuse in tests (but not in vi.mock)
const testDebugValues = {
  rawRms: 0,
  dbValue: 0,
  normalizedVolume: 0,
  smoothedVolume: 0,
  minDb: -30,
  maxDb: 10
}
import { AudioRecorder } from '../AudioRecorder'
import { MediaStreamMock } from '../../test/mocks/media-stream.mock'
import { useAudioVolume } from '../../hooks/useAudioRecording'

// Mock hooks and dependencies
vi.mock('../../hooks/useAudioRecording', () => ({
  useAudioVolume: vi.fn().mockReturnValue({
    currentVolume: 0.5,
    error: undefined,
    initializeAnalysis: vi.fn(),
    stopAnalysis: vi.fn(),
    debugValues: {
      rawRms: 0,
      dbValue: 0,
      normalizedVolume: 0,
      smoothedVolume: 0,
      minDb: -30,
      maxDb: 10
    }
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
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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

  // ... [Previous test cases remain unchanged] ...

  // Test for error retry functionality
  it('allows retrying after an error occurs', async () => {
    // Setup with initial error
    const volumeError = new Error('Volume analysis error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: volumeError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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

  // Test for error modal close functionality
  it('allows closing the error modal', async () => {
    // Setup with initial error
    const volumeError = new Error('Volume analysis error')
    vi.mocked(useAudioVolume).mockReturnValue({
      currentVolume: 0,
      error: volumeError,
      initializeAnalysis: mockInitializeAnalysis,
      stopAnalysis: mockStopAnalysis,
      debugValues: testDebugValues
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
})
