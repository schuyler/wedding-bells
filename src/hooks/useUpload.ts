import { useState, useCallback, useEffect } from 'react';
import { UploadState } from '../types';

interface UploadOptions {
  simulateSuccessRate?: number; // 0-1, chance of success
  simulationDuration?: number; // How long simulation takes in ms
}

const DEFAULT_OPTIONS: UploadOptions = {
  simulateSuccessRate: 0.9, // 90% success rate
  simulationDuration: 3000, // 3 seconds
};

/**
 * Hook for handling file uploads with progress tracking.
 * 
 * This version uses a simulated backend since the real one doesn't exist yet.
 * It mimics the behavior of a real upload, including progress updates and
 * potential failures.
 */
export function useUpload(options: UploadOptions = {}) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  
  // Merge default options with provided options
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // For cleanup on unmount or when starting new upload
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Cleanup function to stop any in-progress uploads
  const cleanup = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  /**
   * Start a simulated file upload
   */
  const startUpload = useCallback((file: Blob, metadata?: Record<string, any>) => {
    // Reset state and clean up any previous upload
    cleanup();
    setUploadState({ status: 'uploading', progress: 0 });
    
    // Create new abort controller for this upload
    const controller = new AbortController();
    setAbortController(controller);
    
    // Return a promise that resolves when upload completes or rejects on error
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const endTime = startTime + config.simulationDuration!;
      
      // Function to update progress
      const updateProgress = () => {
        if (controller.signal.aborted) return;
        
        const now = Date.now();
        const elapsed = now - startTime;
        const totalDuration = config.simulationDuration!;
        
        // Calculate progress based on elapsed time
        const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 99);
        
        if (elapsed >= totalDuration) {
          // Determine if upload "succeeds" or "fails" based on simulateSuccessRate
          if (Math.random() < config.simulateSuccessRate!) {
            // Success
            setUploadState({ status: 'completed', progress: 100 });
            resolve();
          } else {
            // Failure
            setUploadState({ 
              status: 'error', 
              progress: progress,
              error: new Error('Simulated upload failure')
            });
            reject(new Error('Simulated upload failure'));
          }
        } else {
          // Still uploading
          setUploadState({ status: 'uploading', progress });
          
          // Schedule next update
          setTimeout(updateProgress, 100);
        }
      };
      
      // Start progress updates
      setTimeout(updateProgress, 100);
    });
  }, [cleanup, config.simulateSuccessRate, config.simulationDuration]);
  
  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback((file: Blob, metadata?: Record<string, any>) => {
    return startUpload(file, metadata);
  }, [startUpload]);
  
  return {
    uploadState,
    startUpload,
    retryUpload,
    cancelUpload: cleanup
  };
}