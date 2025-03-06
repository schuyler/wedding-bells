import { render, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { AudioRecorderControl, AudioRecorderControls } from '../AudioRecorderControl'
import { MediaStreamMock } from '../../test/mocks/media-stream.mock'

describe('AudioRecorderControl', () => {
  // Mock MediaRecorder
  const mockStart = vi.fn()
  const mockStop = vi.fn()
  const mockPause = vi.fn()
  const mockResume = vi.fn()
  
  // Mock MediaDevices before each test
  beforeEach(() => {
    // Mock MediaRecorder
    const MockMediaRecorder = vi.fn().mockImplementation(() => ({
      start: mockStart.mockImplementation(function(this: any) {
        this.state = 'recording'
        if (this.onstart) this.onstart()
      }),
      stop: mockStop.mockImplementation(function(this: any) {
        this.state = 'inactive'
        // Create a mock Blob for the recording data
        const blob = new Blob(['mock audio data'], { type: 'audio/webm' })
        // Call ondataavailable with the blob
        if (this.ondataavailable) this.ondataavailable({ data: blob })
        // Call onstop
        if (this.onstop) this.onstop()
      }),
      pause: mockPause.mockImplementation(function(this: any) {
        this.state = 'paused'
        if (this.onpause) this.onpause()
      }),
      resume: mockResume.mockImplementation(function(this: any) {
        this.state = 'recording'
        if (this.onresume) this.onresume()
      }),
      state: 'inactive',
      ondataavailable: null,
      onstop: null,
      onpause: null,
      onresume: null,
      onerror: null
    }))

    // @ts-ignore - Mock MediaRecorder
    window.MediaRecorder = MockMediaRecorder
    
    // Create a mock implementation of getUserMedia that returns a MediaStreamMock
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(new MediaStreamMock())
      },
      writable: true
    })
  })

  // Restore all mocks after each test
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Permission handling', () => {
    // Test case: Permission granted
    it('handles microphone permission correctly when granted', async () => {
      // Create a mock for permission change callback
      const onPermissionChange = vi.fn()
      const onError = vi.fn()

      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onPermissionChange={onPermissionChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Explicitly call checkPermission method
      await act(async () => {
        const result = await recorderRef.current?.checkPermission()
        expect(result).toBe(true)
      })

      // Verify permission change callback was called with true
      expect(onPermissionChange).toHaveBeenCalledWith(true)
      
      // Verify no errors were triggered
      expect(onError).not.toHaveBeenCalled()
    })

    // Test case: Permission denied
    it('handles microphone permission denial correctly', async () => {
      // Mock permission denial
      const permissionError = new Error('Permission denied')
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(permissionError)
      
      // Create a mock for permission change callback
      const onPermissionChange = vi.fn()
      const onError = vi.fn()

      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onPermissionChange={onPermissionChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Explicitly call checkPermission method
      await act(async () => {
        const result = await recorderRef.current?.checkPermission()
        expect(result).toBe(false)
      })

      // Verify permission change callback was called with false
      expect(onPermissionChange).toHaveBeenCalledWith(false)
      
      // Verify error was triggered
      expect(onError).toHaveBeenCalledWith(permissionError)
    })

    // Test case: hasPermission method
    it('returns correct permission state via hasPermission method', async () => {
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Initially permission state should be null
      expect(recorderRef.current?.hasPermission()).toBe(null)

      // Check permission
      await act(async () => {
        await recorderRef.current?.checkPermission()
      })

      // Now permission state should be true
      expect(recorderRef.current?.hasPermission()).toBe(true)
    })
  })

  describe('Recording lifecycle', () => {
    // Test case: Starting recording
    it('starts recording correctly', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Verify MediaRecorder.start was called
      expect(mockStart).toHaveBeenCalled()
      
      // Verify onStateChange was called with correct state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 0
      })
      
      // Verify no errors were triggered
      expect(onError).not.toHaveBeenCalled()
    })

    // Test case: Stopping recording
    it('stops recording correctly', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onRecordingData = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onRecordingData={onRecordingData}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Reset mocks to focus on stop behavior
      onStateChange.mockReset()
      
      // Stop recording
      await act(async () => {
        await recorderRef.current?.stopRecording()
      })

      // Verify MediaRecorder.stop was called
      expect(mockStop).toHaveBeenCalled()
      
      // Verify onStateChange was called with correct state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: false,
        isPaused: false,
        duration: expect.any(Number)
      })
      
      // Verify onRecordingData was called with a Blob
      expect(onRecordingData).toHaveBeenCalledWith(expect.any(Blob))
      
      // Verify no errors were triggered
      expect(onError).not.toHaveBeenCalled()
    })

    // Test case: Pausing recording
    it('pauses recording correctly', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Reset mocks to focus on pause behavior
      onStateChange.mockReset()
      
      // Pause recording
      await act(async () => {
        recorderRef.current?.pauseRecording()
      })

      // Verify MediaRecorder.pause was called
      expect(mockPause).toHaveBeenCalled()
      
      // Verify onStateChange was called with correct state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: true,
        duration: expect.any(Number)
      })
      
      // Verify no errors were triggered
      expect(onError).not.toHaveBeenCalled()
    })

    // Test case: Resuming recording
    it('resumes recording correctly', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Pause recording
      await act(async () => {
        recorderRef.current?.pauseRecording()
      })

      // Reset mocks to focus on resume behavior
      onStateChange.mockReset()
      
      // Resume recording
      await act(async () => {
        recorderRef.current?.resumeRecording()
      })

      // Verify MediaRecorder.resume was called
      expect(mockResume).toHaveBeenCalled()
      
      // Verify onStateChange was called with correct state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: expect.any(Number)
      })
      
      // Verify no errors were triggered
      expect(onError).not.toHaveBeenCalled()
    })

    // Test case: Full recording lifecycle
    it('handles full recording lifecycle correctly', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onRecordingData = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onRecordingData={onRecordingData}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Verify initial state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 0
      })

      // Pause recording
      await act(async () => {
        recorderRef.current?.pauseRecording()
      })

      // Verify paused state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: true,
        duration: expect.any(Number)
      })

      // Resume recording
      await act(async () => {
        recorderRef.current?.resumeRecording()
      })

      // Verify resumed state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: expect.any(Number)
      })

      // Stop recording
      await act(async () => {
        await recorderRef.current?.stopRecording()
      })

      // Verify stopped state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: false,
        isPaused: false,
        duration: expect.any(Number)
      })

      // Verify recording data was provided
      expect(onRecordingData).toHaveBeenCalledWith(expect.any(Blob))
    })
  })

  describe('Error handling', () => {
    // Test case: Error during recording start
    it('handles errors during recording start', async () => {
      // First grant permission so we can test the actual MediaRecorder error
      const permissionError = new Error('Failed to start recording')
      
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // First check permission to set permissionState to true
      await act(async () => {
        await recorderRef.current?.checkPermission()
      })

      // Now mock getUserMedia to reject for the startRecording call
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(permissionError)
      
      // Reset mocks to focus on start behavior
      onStateChange.mockReset()
      onError.mockReset()

      // Attempt to start recording
      await act(async () => {
        const result = await recorderRef.current?.startRecording()
        // Should return null on error
        expect(result).toBe(null)
      })

      // Verify onError was called with the error
      expect(onError).toHaveBeenCalledWith(permissionError)
      
      // Verify recording state was not changed
      expect(onStateChange).not.toHaveBeenCalled()
    })

    // Test case: Error during recording stop
    it('handles errors during recording stop', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Reset mocks to focus on stop behavior
      onStateChange.mockReset()
      
      // Mock MediaRecorder.stop to throw an error
      mockStop.mockImplementationOnce(() => {
        throw new Error('Failed to stop recording')
      })
      
      // Attempt to stop recording
      await act(async () => {
        const result = await recorderRef.current?.stopRecording()
        // Should return null on error
        expect(result).toBe(null)
      })

      // Verify onError was called with an error
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toBe('Failed to stop recording')
    })

    // Test case: Error during recording pause
    it('handles errors during recording pause', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Reset mocks to focus on pause behavior
      onStateChange.mockReset()
      
      // Mock MediaRecorder.pause to throw an error
      mockPause.mockImplementationOnce(() => {
        throw new Error('Failed to pause recording')
      })
      
      // Attempt to pause recording
      await act(async () => {
        recorderRef.current?.pauseRecording()
      })

      // Verify onError was called with an error
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toBe('Failed to pause recording')
      
      // Verify state was not changed
      expect(onStateChange).not.toHaveBeenCalled()
    })

    // Test case: Error during recording resume
    it('handles errors during recording resume', async () => {
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      const onError = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
          onError={onError}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Pause recording
      await act(async () => {
        recorderRef.current?.pauseRecording()
      })

      // Reset mocks to focus on resume behavior
      onStateChange.mockReset()
      
      // Mock MediaRecorder.resume to throw an error
      mockResume.mockImplementationOnce(() => {
        throw new Error('Failed to resume recording')
      })
      
      // Attempt to resume recording
      await act(async () => {
        recorderRef.current?.resumeRecording()
      })

      // Verify onError was called with an error
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onError.mock.calls[0][0].message).toBe('Failed to resume recording')
      
      // Verify state was not changed
      expect(onStateChange).not.toHaveBeenCalled()
    })
  })

  describe('Duration management', () => {
    // Test case: Duration tracking during recording
    it('tracks duration during recording', async () => {
      // Setup fake timers
      vi.useFakeTimers()
      
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })

      // Verify initial state
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 0
      })
      
      // Reset onStateChange mock to focus on duration updates
      onStateChange.mockReset()
      
      // Advance timers by 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      
      // Verify duration was updated to 1
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 1
      })
      
      // Reset onStateChange mock again
      onStateChange.mockReset()
      
      // Advance timers by another second
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      
      // Verify duration was updated to 2
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 2
      })
      
      // Cleanup
      vi.useRealTimers()
    })
    
    // Test case: Duration reset on stop/new recording
    it('resets duration when starting a new recording', async () => {
      // Setup fake timers
      vi.useFakeTimers()
      
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })
      
      // Advance timers to increase duration
      await act(async () => {
        vi.advanceTimersByTime(3000) // 3 seconds
      })
      
      // Stop recording
      await act(async () => {
        await recorderRef.current?.stopRecording()
      })
      
      // Reset onStateChange mock to focus on new recording
      onStateChange.mockReset()
      
      // Start a new recording
      await act(async () => {
        await recorderRef.current?.startRecording()
      })
      
      // Verify duration was reset to 0
      expect(onStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isPaused: false,
        duration: 0
      })
      
      // Cleanup
      vi.useRealTimers()
    })
  })

  describe('Resource management', () => {
    // Test case: Cleanup on unmount
    it('cleans up resources on unmount', async () => {
      // Create a spy on MediaStream.getTracks()[0].stop
      const trackStopSpy = vi.fn()
      
      // Create a mock MediaStream with a track that has a stop method
      const mockTrack = { stop: trackStopSpy, kind: 'audio' }
      const mockMediaStream = new MediaStreamMock([mockTrack as any]) as unknown as MediaStream
      
      // Mock getUserMedia to return our custom MediaStream
      vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce(mockMediaStream)
      
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      const { unmount } = render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording to initialize MediaRecorder and MediaStream
      await act(async () => {
        await recorderRef.current?.startRecording()
      })
      
      // Unmount the component
      unmount()
      
      // Verify that track.stop was called to clean up MediaStream
      expect(trackStopSpy).toHaveBeenCalled()
    })
    
    // Test case: Cleanup on component re-render
    it('cleans up resources when starting a new recording', async () => {
      // Create a spy on MediaStream.getTracks()[0].stop
      const trackStopSpy = vi.fn()
      
      // Create a mock MediaStream with a track that has a stop method
      const mockTrack = { stop: trackStopSpy, kind: 'audio' }
      const mockMediaStream = new MediaStreamMock([mockTrack as any]) as unknown as MediaStream
      
      // Mock getUserMedia to return our custom MediaStream
      vi.mocked(navigator.mediaDevices.getUserMedia)
        .mockResolvedValueOnce(mockMediaStream)
        .mockResolvedValueOnce(new MediaStreamMock() as unknown as MediaStream) // Second call returns a different stream
      
      // Create mocks for callbacks
      const onStateChange = vi.fn()
      
      // Create a ref to access the component methods
      const recorderRef = React.createRef<AudioRecorderControls>()
      
      // Render the component with the ref
      render(
        <AudioRecorderControl
          ref={recorderRef}
          onStateChange={onStateChange}
        >
          <div data-testid="child" />
        </AudioRecorderControl>
      )

      // Start recording to initialize MediaRecorder and MediaStream
      await act(async () => {
        await recorderRef.current?.startRecording()
      })
      
      // Start a new recording without stopping the first one
      // This should clean up the first MediaStream
      await act(async () => {
        await recorderRef.current?.startRecording()
      })
      
      // Verify that track.stop was called to clean up the first MediaStream
      expect(trackStopSpy).toHaveBeenCalled()
    })
  })
})
