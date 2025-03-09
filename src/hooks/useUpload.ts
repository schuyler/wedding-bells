import { useState, useCallback, useEffect } from 'react';
import { UploadState, DEFAULT_UPLOAD_CONFIG, UploadConfig } from '../types';

interface UploadOptions {
  apiUrl?: string;
  uploadToken?: string;
  simulateUpload?: boolean;
  simulateSuccessRate?: number; // 0-1, chance of success when simulating
  simulationDuration?: number; // How long simulation takes in ms
}

/**
 * Hook for handling file uploads with progress tracking.
 * 
 * This hook provides two modes:
 * 1. Real upload to the Cloudflare Worker API
 * 2. Simulated upload for testing (fallback when API is not available)
 */
export function useUpload(options: UploadOptions = {}) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  
  // Get configuration - first from provided options, then env vars, then defaults
  const config: UploadConfig = {
    apiUrl: options.apiUrl || import.meta.env.VITE_API_URL || DEFAULT_UPLOAD_CONFIG.apiUrl,
    uploadToken: options.uploadToken || import.meta.env.VITE_UPLOAD_TOKEN || DEFAULT_UPLOAD_CONFIG.uploadToken,
  };
  
  // Determine if we should simulate the upload
  const shouldSimulate = options.simulateUpload || 
    (import.meta.env.VITE_SIMULATE_UPLOAD === 'true') || 
    !config.apiUrl.startsWith('http');
  
  // Simulation settings
  const simulationSettings = {
    successRate: options.simulateSuccessRate || 0.9, // 90% success rate
    duration: options.simulationDuration || 3000, // 3 seconds
  };
  
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
  
  // Prevent navigation during active upload
  useEffect(() => {
    // Only add listener if actively uploading
    if (uploadState.status === 'uploading' && uploadState.progress > 0 && uploadState.progress < 100) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const message = 'Upload in progress. If you leave now, your recording will not be saved. Continue?';
        
        // Modern browsers require both of these for the confirmation dialog to appear
        // Even though returnValue is deprecated, it's still required for cross-browser compatibility
        e.preventDefault();
        e.returnValue = message;
        
        // Returning a string triggers the confirmation dialog in older browsers
        return message;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [uploadState.status, uploadState.progress]);
  
  /**
   * Creates a FormData object with the file and metadata
   */
  const createFormData = useCallback((file: Blob, metadata?: Record<string, string | number>) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    return formData;
  }, []);
  
  /**
   * Simulates upload progress with updates over time
   */
  const simulateUpload = useCallback((controller: AbortController, resolve: (value?: unknown) => void, reject: (error: Error) => void) => {
    const startTime = Date.now();
    const totalDuration = simulationSettings.duration;
    
    const updateProgress = () => {
      if (controller.signal.aborted) return;
      
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Calculate progress based on elapsed time
      const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 99);
      
      if (elapsed >= totalDuration) {
        // Determine if upload "succeeds" or "fails" based on simulateSuccessRate
        if (Math.random() < simulationSettings.successRate) {
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
  }, [simulationSettings.duration, simulationSettings.successRate]);
  
  /**
   * Perform a real upload to the Cloudflare Worker API
   */
  const performRealUpload = useCallback(async (
    file: Blob, 
    metadata: Record<string, string | number> | undefined, 
    controller: AbortController
  ) => {
    try {
      // Create form data
      const formData = createFormData(file, metadata);
      
      // Create upload URL
      const uploadUrl = new URL(config.apiUrl.startsWith('http') 
        ? config.apiUrl 
        : `${window.location.origin}${config.apiUrl}`);
      
      // Initialize progress to 10% - this represents the upload starting
      setUploadState({ status: 'uploading', progress: 10 });
      
      // Set up iOS Safari specific handling
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Setup longer timeout for iOS Safari (90 seconds)
      const timeoutMs = (isIOS && isSafari) ? 90000 : 60000;
      
      // For iOS Safari, we'll retry uploads instead of just aborting
      const maxRetries = 3;
      let retryCount = 0;
      let retryTimeoutId: number | null = null;
      
      // Create a function to handle uploading with retries
      const attemptUploadWithRetry = async (): Promise<unknown> => {
        try {
          // Make the fetch request with the form data
          const response = await Promise.race([
            fetch(uploadUrl.toString(), {
              method: 'POST',
              body: formData,
              signal: controller.signal,
              headers: {
                'X-Upload-Token': config.uploadToken
              },
            }),
            new Promise<Response>((_, reject) => {
              retryTimeoutId = window.setTimeout(() => {
                reject(new Error('Upload request timed out'));
              }, timeoutMs);
            })
          ]);
          
          // Clear timeout since we got a response
          if (retryTimeoutId) clearTimeout(retryTimeoutId);
          
          // Update progress to 90% after server receives the file
          setUploadState({ status: 'uploading', progress: 90 });
          
          // Parse the response
          const result = await response.json();
          
          // Check if the upload was successful
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Upload failed');
          }
          
          // Set state to completed with 100% progress
          setUploadState({ status: 'completed', progress: 100 });
          
          // Add a small delay to ensure progress bar animation completes
          await new Promise(resolve => setTimeout(resolve, 600));
          
          return result;
        } catch (error) {
          // Clear the timeout
          if (retryTimeoutId) clearTimeout(retryTimeoutId);
          
          // If we still have retries left, try again
          if (retryCount < maxRetries && (isIOS && isSafari) && !controller.signal.aborted) {
            retryCount++;
            
            // Update progress to show retry attempt
            setUploadState({ 
              status: 'uploading', 
              progress: 10 + (retryCount * 5), // Increment progress slightly with each retry
              retryAttempt: retryCount
            });
            
            console.log(`Upload attempt ${retryCount}/${maxRetries} failed, retrying...`);
            
            // Wait before retrying (increasing delay with each retry)
            const retryDelay = 2000 * retryCount; // 2s, 4s, 6s
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            // Retry the upload
            return attemptUploadWithRetry();
          }
          
          // If we're out of retries or it's not iOS Safari, propagate the error
          throw error;
        }
      };
      
      // Call our retry-enabled upload function
      if (isIOS && isSafari) {
        // Use the retry-enabled upload for iOS Safari
        return await attemptUploadWithRetry();
      } else {
        // For other browsers, use the standard upload
        const response = await fetch(uploadUrl.toString(), {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'X-Upload-Token': config.uploadToken
          },
        });
        
        // Update progress to 90% after server receives the file
        setUploadState({ status: 'uploading', progress: 90 });
        
        // Parse the response
        const result = await response.json();
        
        // Check if the upload was successful
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Upload failed');
        }
        
        // Set state to completed with 100% progress
        setUploadState({ status: 'completed', progress: 100 });
        
        // Add a small delay to ensure progress bar animation completes
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return result;
      }
    } catch (error) {
      if (controller.signal.aborted) {
        // If aborted, just return without updating state
        return;
      }
      
      // Provide more specific error messages for network issues
      let errorMessage = 'Unknown upload error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Improve error messages for common network issues
        if (error.name === 'AbortError') {
          errorMessage = 'Upload timed out. Please try again with a better connection.';
        } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'Upload timed out. Please try again with a better connection.';
        }
      }
      
      // Set error state
      setUploadState({ 
        status: 'error', 
        progress: uploadState.progress,
        error: error instanceof Error ? new Error(errorMessage) : new Error(errorMessage)
      });
      
      throw error;
    }
  }, [config.apiUrl, config.uploadToken, createFormData, uploadState.progress]);
  
  /**
   * Start a file upload - real or simulated based on configuration
   */
  const startUpload = useCallback((file: Blob, metadata?: Record<string, string | number>) => {
    // Reset state and clean up any previous upload
    cleanup();
    setUploadState({ status: 'uploading', progress: 0 });
    
    // Create new abort controller for this upload
    const controller = new AbortController();
    setAbortController(controller);
    
    // Return a promise that resolves when upload completes or rejects on error
    return new Promise<unknown>((resolve, reject) => {
      if (shouldSimulate) {
        // Use simulated upload
        simulateUpload(controller, resolve, reject);
      } else {
        // Use real upload
        performRealUpload(file, metadata, controller)
          .then(resolve)
          .catch(reject);
      }
    });
  }, [cleanup, shouldSimulate, simulateUpload, performRealUpload]);
  
  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback((file: Blob, metadata?: Record<string, string | number>) => {
    return startUpload(file, metadata);
  }, [startUpload]);
  
  return {
    uploadState,
    startUpload,
    retryUpload,
    cancelUpload: cleanup,
    isSimulated: shouldSimulate
  };
}