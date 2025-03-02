import { renderHook, act } from '@testing-library/react';
import { useAudioVolume } from '../useAudioRecording';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock implementations for Web Audio API
let mockGetByteTimeDomainData: ReturnType<typeof vi.fn>;
let mockRequestAnimationFrame: ReturnType<typeof vi.fn>;
let mockCancelAnimationFrame: ReturnType<typeof vi.fn>;
let mockAudioContextClose: ReturnType<typeof vi.fn>;

// Setup global mocks
beforeEach(() => {
  // Mock requestAnimationFrame
  mockRequestAnimationFrame = vi.fn().mockReturnValue(123);
  mockCancelAnimationFrame = vi.fn();
  window.requestAnimationFrame = mockRequestAnimationFrame as any;
  window.cancelAnimationFrame = mockCancelAnimationFrame as any;
  
  // Mock AudioContext
  mockGetByteTimeDomainData = vi.fn();
  mockAudioContextClose = vi.fn();
  
  window.AudioContext = vi.fn().mockImplementation(() => ({
    createAnalyser: () => ({
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteTimeDomainData: mockGetByteTimeDomainData,
    }),
    createMediaStreamSource: () => ({
      connect: vi.fn(),
    }),
    close: mockAudioContextClose,
  }));
});

// Helper to create a mock MediaStream
function createMockMediaStream() {
  return {
    getTracks: () => [],
    getAudioTracks: () => [],
  } as unknown as MediaStream;
}

// Helper to simulate audio data with a specific volume level
function simulateAudioData(volume: number = 0.5) {
  mockGetByteTimeDomainData.mockImplementation((array: Uint8Array) => {
    // For simplicity, we'll set values that will result in the desired volume
    // In a real scenario, this would be more complex based on the RMS calculation
    const amplitude = Math.sqrt(volume) * 128;
    for (let i = 0; i < array.length; i++) {
      // Center at 128 (silence) and add amplitude
      array[i] = Math.round(128 + amplitude * Math.sin(i / 10));
    }
  });
}

describe('useAudioVolume', () => {
  it('initializes with volume of 0', () => {
    const { result } = renderHook(() => useAudioVolume());
    expect(result.current.currentVolume).toBe(0);
  });

  it('provides expected interface properties', () => {
    const { result } = renderHook(() => useAudioVolume());
    expect(result.current).toHaveProperty('currentVolume');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('initializeAnalysis');
    expect(result.current).toHaveProperty('stopAnalysis');
  });

  it('starts analysis when initializeAnalysis is called', () => {
    const { result } = renderHook(() => useAudioVolume());
    
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
    });
    
    expect(window.AudioContext).toHaveBeenCalled();
    expect(mockRequestAnimationFrame).toHaveBeenCalled();
  });

  it('updates volume based on audio data', async () => {
    const { result } = renderHook(() => useAudioVolume());
    
    // Simulate medium volume audio
    simulateAudioData(0.5);
    
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
    });
    
    // Manually trigger the animation frame callback
    const animationCallback = mockRequestAnimationFrame.mock.calls[0][0];
    act(() => {
      animationCallback();
    });
    
    // Volume should be updated (exact value will depend on the calculation)
    expect(result.current.currentVolume).toBeGreaterThan(0);
  });

  it('cleans up resources when stopAnalysis is called', () => {
    const { result } = renderHook(() => useAudioVolume());
    
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
      result.current.stopAnalysis();
    });
    
    expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
    expect(mockAudioContextClose).toHaveBeenCalled();
  });

  it('handles errors during initialization', () => {
    // Mock AudioContext to throw an error
    window.AudioContext = vi.fn().mockImplementation(() => {
      throw new Error('AudioContext error');
    });
    
    const { result } = renderHook(() => useAudioVolume());
    
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
    });
    
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('AudioContext error');
  });

  it('accepts custom decibel range configuration', () => {
    const { result } = renderHook(() => 
      useAudioVolume({ minDecibels: -50, maxDecibels: 0 })
    );
    
    // Simulate very quiet audio that would be audible with these settings
    simulateAudioData(0.1);
    
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
    });
    
    // Manually trigger the animation frame callback
    const animationCallback = mockRequestAnimationFrame.mock.calls[0][0];
    act(() => {
      animationCallback();
    });
    
    // With the wider range, even quiet audio should register some volume
    expect(result.current.currentVolume).toBeGreaterThan(0);
  });

  it('cleans up on unmount', () => {
    const { result, unmount } = renderHook(() => useAudioVolume());
    
    // Initialize analysis after rendering
    act(() => {
      result.current.initializeAnalysis(createMockMediaStream());
    });
    
    // Unmount to trigger cleanup
    unmount();
    
    // Verify cleanup was called
    expect(mockCancelAnimationFrame).toHaveBeenCalled();
    expect(mockAudioContextClose).toHaveBeenCalled();
  });
});
