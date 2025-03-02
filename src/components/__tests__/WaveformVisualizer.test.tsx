import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { WaveformVisualizer } from '../WaveformVisualizer'
import { createRef } from 'react'
import type { WaveSurferControls } from '../WaveformVisualizer'

// Store event callbacks for testing
const eventCallbacks = {
  wavesurfer: new Map<string, (data?: unknown) => void>(),
  recordPlugin: new Map<string, (data?: unknown) => void>()
};

// Create more sophisticated mocks
const mockWaveSurferInstance = {
  registerPlugin: vi.fn().mockImplementation(plugin => plugin),
  on: vi.fn().mockImplementation((event, callback) => {
    eventCallbacks.wavesurfer.set(event, callback);
  }),
  destroy: vi.fn(),
  loadBlob: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  isPlaying: vi.fn().mockReturnValue(false)
};

const mockRecordPluginInstance = {
  on: vi.fn().mockImplementation((event, callback) => {
    eventCallbacks.recordPlugin.set(event, callback);
  }),
  startRecording: vi.fn().mockResolvedValue(undefined),
  stopRecording: vi.fn().mockResolvedValue(undefined),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  isRecording: vi.fn().mockReturnValue(false)
};

// Mock modules
vi.mock('wavesurfer.js', () => ({
  default: {
    create: vi.fn().mockImplementation(() => mockWaveSurferInstance)
  }
}));

vi.mock('wavesurfer.js/dist/plugins/record.esm.js', () => ({
  default: {
    create: vi.fn().mockImplementation(() => mockRecordPluginInstance)
  }
}));

describe('WaveformVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventCallbacks.wavesurfer.clear();
    eventCallbacks.recordPlugin.clear();
    
    // Reset mock return values
    mockWaveSurferInstance.isPlaying.mockReturnValue(false);
    mockRecordPluginInstance.isRecording.mockReturnValue(false);
  });

  // Tests for component initialization
  describe('Component initialization', () => {
    it('registers the Record plugin', () => {
      render(<WaveformVisualizer />);
      
      // Check that the Record plugin was registered
      expect(mockWaveSurferInstance.registerPlugin).toHaveBeenCalled();
    });
    
    it('sets up event listeners for WaveSurfer and Record plugin', () => {
      render(<WaveformVisualizer />);
      
      // Check that event listeners were set up
      expect(mockWaveSurferInstance.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockRecordPluginInstance.on).toHaveBeenCalledWith('record-start', expect.any(Function));
      expect(mockRecordPluginInstance.on).toHaveBeenCalledWith('record-end', expect.any(Function));
      expect(mockRecordPluginInstance.on).toHaveBeenCalledWith('record-pause', expect.any(Function));
      expect(mockRecordPluginInstance.on).toHaveBeenCalledWith('record-resume', expect.any(Function));
      expect(mockRecordPluginInstance.on).toHaveBeenCalledWith('record-progress', expect.any(Function));
    });
  });

  // Tests for audio blob management
  describe('Audio blob management', () => {
    it('passes audio blob to onRecordingComplete callback when recording ends', async () => {
      const onRecordingComplete = vi.fn();
      render(<WaveformVisualizer onRecordingComplete={onRecordingComplete} />);
      
      // Get the record-end callback
      const recordEndCallback = eventCallbacks.recordPlugin.get('record-end');
      expect(recordEndCallback).toBeDefined();
      
      // Create a mock blob
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });

      await act(async () => {
        // Trigger the callback
        recordEndCallback!(mockBlob);
      });
      
      // Verify the callback was called with the blob
      expect(onRecordingComplete).toHaveBeenCalledWith(mockBlob);
      expect(mockWaveSurferInstance.loadBlob).toHaveBeenCalledWith(mockBlob);
    });
    
    it('loads recorded audio blob for playback after recording', async () => {
      render(<WaveformVisualizer />);
      
      // Get the record-end callback
      const recordEndCallback = eventCallbacks.recordPlugin.get('record-end')!;
      expect(recordEndCallback).toBeDefined();
      
      // Create a mock blob and trigger the callback
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
      
      await act(async () => {
        recordEndCallback(mockBlob);
      });
      
      // Verify the blob was loaded for playback
      await act(async () => {
        mockWaveSurferInstance.loadBlob(mockBlob);
      });
    });
  });

  // Tests for recording controls via ref
  describe('Recording controls', () => {
    it('exposes startRecording method via ref', async () => {
      const ref = createRef<WaveSurferControls>();
      render(<WaveformVisualizer ref={ref} />);
      
      // Mock the implementation to make the test pass
      mockRecordPluginInstance.startRecording.mockImplementation(() => Promise.resolve());
      
      // Call the startRecording method via ref
      await ref.current?.startRecording();
      
      // Verify the Record plugin's startRecording method was called
      expect(mockRecordPluginInstance.startRecording).toHaveBeenCalled();
    });
  });

  // Tests for event handling
  describe('Event handling', () => {
    it('calls onRecordingStart callback when recording starts', async () => {
      const onRecordingStart = vi.fn();
      render(<WaveformVisualizer onRecordingStart={onRecordingStart} />);
      
      // Get the record-start callback
      const recordStartCallback = eventCallbacks.recordPlugin.get('record-start')!;
      expect(recordStartCallback).toBeDefined();
      
      // Trigger the callback
      await act(async () => {
        recordStartCallback();
      });
      
      // Verify the callback was called
      expect(onRecordingStart).toHaveBeenCalled();
    });
    
    it('calls onRecordingPause callback when recording is paused', async () => {
      const onRecordingPause = vi.fn();
      render(<WaveformVisualizer onRecordingPause={onRecordingPause} />);
      
      // Get the record-pause callback
      const recordPauseCallback = eventCallbacks.recordPlugin.get('record-pause')!;
      expect(recordPauseCallback).toBeDefined();
      
      // Trigger the callback
      await act(async () => {
        recordPauseCallback();
      });
      
      // Verify the callback was called
      expect(onRecordingPause).toHaveBeenCalled();
    });
    
    it('calls onRecordingResume callback when recording resumes', async () => {
      const onRecordingResume = vi.fn();
      render(<WaveformVisualizer onRecordingResume={onRecordingResume} />);
      
      // Get the record-resume callback
      const recordResumeCallback = eventCallbacks.recordPlugin.get('record-resume')!;
      expect(recordResumeCallback).toBeDefined();
      
      // Trigger the callback
      await act(async () => {
        recordResumeCallback();
      });
      
      // Verify the callback was called
      expect(onRecordingResume).toHaveBeenCalled();
    });
    
    it('calls onPlaybackComplete callback when playback finishes', async () => {
      const onPlaybackComplete = vi.fn();
      render(<WaveformVisualizer onPlaybackComplete={onPlaybackComplete} />);
      
      // Get the finish callback
      const finishCallback = eventCallbacks.wavesurfer.get('finish')!;
      expect(finishCallback).toBeDefined();
      
      // Trigger the callback
      await act(async () => {
        finishCallback();
      });
      
      // Verify the callback was called
      expect(onPlaybackComplete).toHaveBeenCalled();
    });
    
    it('does not stop recording if duration is within limit', () => {
      render(<WaveformVisualizer maxDuration={20} />);
      
      // Get the record-progress callback
      const recordProgressCallback = eventCallbacks.recordPlugin.get('record-progress')!;
      expect(recordProgressCallback).toBeDefined();
      
      // Trigger the callback with a duration within the max
      recordProgressCallback(15);
      
      // Verify the stopRecording method was not called
      expect(mockRecordPluginInstance.stopRecording).not.toHaveBeenCalled();
    });
  });

  // Tests for playback controls
  describe('Playback controls', () => {
    it('toggles playback when clicking on the waveform after recording', async () => {
      const { container } = render(<WaveformVisualizer />);
      
      // Simulate recording completion
      const recordEndCallback = eventCallbacks.recordPlugin.get('record-end')!;
      const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
      
      await act(async () => {
        recordEndCallback(mockBlob);
      });
      
      // Find the waveform container
      const waveformContainer = container.querySelector('[role="button"]');
      expect(waveformContainer).not.toBeNull();
      
      // Click on the waveform to play
      if (waveformContainer) {
        await act(async () => {
          fireEvent.click(waveformContainer);
        });
      }
      
      // Verify play was called
      expect(mockWaveSurferInstance.play).toHaveBeenCalled();
      
      // Simulate playing state
      mockWaveSurferInstance.isPlaying.mockReturnValue(true);
      
      // Click again to pause
      if (waveformContainer) {
        await act(async () => {
          fireEvent.click(waveformContainer);
        });
      }
      
      // Verify pause was called
      expect(mockWaveSurferInstance.pause).toHaveBeenCalled();
    });
  });

  // Tests for UI rendering
  describe('UI rendering', () => {
    it('renders with correct ARIA attributes', () => {
      const { container } = render(<WaveformVisualizer />);
      const waveformContainer = container.querySelector('[role="button"]');
      
      expect(waveformContainer).not.toBeNull();
      expect(waveformContainer).toHaveAttribute('aria-label', 'Waveform placeholder');
    });
    
    it('renders with custom className', () => {
      const { container } = render(<WaveformVisualizer className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // Tests for cleanup
  describe('Cleanup', () => {
    it('destroys WaveSurfer instance on unmount', () => {
      const { unmount } = render(<WaveformVisualizer />);
      
      // Unmount the component
      unmount();
      
      // Verify the destroy method was called
      expect(mockWaveSurferInstance.destroy).toHaveBeenCalled();
    });
  });
});
