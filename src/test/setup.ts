import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { mockAnimationsApi } from 'jsdom-testing-mocks';

/**
 * MockMediaRecorder: A test implementation of the MediaRecorder Web API
 * 
 * This mock provides a controlled testing environment for components that rely on
 * the MediaRecorder API for audio/video recording functionality. It simulates the
 * behavior of the native MediaRecorder with predictable outputs.
 * 
 * Implementation Notes:
 * - Implements core MediaRecorder lifecycle methods (start, stop, pause, resume)
 * - Provides event handlers that match the native API (ondataavailable, onstop, etc.)
 * - Generates consistent mock audio data for testing recording completion
 * - Maintains proper state transitions between recording states
 * 
 * Testing Considerations:
 * - All asynchronous operations are made synchronous for testing predictability
 * - Event handlers are triggered immediately rather than asynchronously
 * - Fixed audio format (audio/webm) and mock data are used for consistency
 */
class MockMediaRecorder {
  /** Current state of the recorder: 'inactive', 'recording', or 'paused' */
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  
  /** Event handler for data availability */
  ondataavailable: ((event: any) => void) | null = null;
  
  /** Event handler for recording stop */
  onstop: ((event: Event) => void) | null = null;
  
  /** Event handler for recording start */
  onstart: ((event: Event) => void) | null = null;
  
  /** Event handler for recording pause */
  onpause: ((event: Event) => void) | null = null;
  
  /** Event handler for recording resume */
  onresume: ((event: Event) => void) | null = null;
  
  /** Event handler for errors */
  onerror: ((event: Event) => void) | null = null;

  /**
   * Creates a new MockMediaRecorder instance
   * 
   * @param stream - MediaStream to record from (unused in mock implementation)
   * @param options - Optional configuration parameters (unused in mock implementation)
   */
  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {
    // In a real implementation, this would configure the recorder
    // For testing purposes, we don't need to use these parameters
  }

  /**
   * Starts recording media
   * 
   * @param timeslice - Optional timeslice parameter for ondataavailable events (unused in mock)
   */
  start(_timeslice?: number) {
    // Update state to recording
    this.state = 'recording';
    
    // Trigger start event if handler exists
    if (this.onstart) this.onstart(new Event('start'));
  }

  /**
   * Stops recording and triggers appropriate events
   * 
   * In the real MediaRecorder, this would finalize the recording and make data available.
   * In our mock, we immediately create a mock Blob and trigger the events.
   */
  stop() {
    // Update state to inactive
    this.state = 'inactive';
    
    // Create a mock Blob for the recording data
    const blob = new Blob(['mock audio data'], { type: 'audio/webm' });
    
    // Call ondataavailable with the blob
    if (this.ondataavailable) {
      this.ondataavailable({ data: blob } as any);
    }
    
    // Call onstop to signal recording completion
    if (this.onstop) {
      this.onstop(new Event('stop'));
    }
  }

  /**
   * Pauses the current recording
   * 
   * Updates state and triggers the pause event handler if defined
   */
  pause() {
    // Update state to paused
    this.state = 'paused';
    
    // Trigger pause event if handler exists
    if (this.onpause) {
      this.onpause(new Event('pause'));
    }
  }

  /**
   * Resumes a paused recording
   * 
   * Updates state and triggers the resume event handler if defined
   */
  resume() {
    // Update state to recording
    this.state = 'recording';
    
    // Trigger resume event if handler exists
    if (this.onresume) {
      this.onresume(new Event('resume'));
    }
  }
}

// Register the mock MediaRecorder globally for tests
// @ts-ignore - Ignore type checking for this global assignment
global.MediaRecorder = MockMediaRecorder;

// Mock Web Audio API
const createMockAudioContext = () => ({
  createMediaStreamSource: () => ({
    connect: () => {},
    disconnect: () => {}
  }),
  createAnalyser: () => ({
    connect: () => {},
    disconnect: () => {},
    frequencyBinCount: 2048,
    getFloatFrequencyData: () => new Float32Array(2048),
    getByteFrequencyData: () => new Uint8Array(2048)
  }),
  resume: () => Promise.resolve(),
  close: () => Promise.resolve(),
  state: 'running'
});

// @ts-ignore
global.AudioContext = createMockAudioContext;
// @ts-ignore
global.window.AudioContext = createMockAudioContext;

// Mock MediaDevices and MediaStream
const createMockMediaStream = () => ({
  getTracks: () => [{
    stop: () => {},
    kind: 'audio'
  }],
  getAudioTracks: () => [{
    stop: () => {},
    kind: 'audio'
  }]
});

// @ts-ignore
global.navigator.mediaDevices = {
  getUserMedia: () => Promise.resolve(createMockMediaStream())
};

mockAnimationsApi();

// Clean up after each test
afterEach(() => {
  cleanup();
});
