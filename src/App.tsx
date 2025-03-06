import { useState } from 'react';
import { BrowserCheck } from './components/BrowserCheck';
import { BrowserCompatibility, RecordingState } from './types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RecordingProvider } from './context/RecordingContext';
import { WelcomeView } from './views/WelcomeView';
import { RecordingView } from './views/RecordingView';
import { UploadView } from './views/UploadView';
import { ThankYouView } from './views/ThankYouView';
import { ProgressIndicator } from './components/ProgressIndicator';

/**
 * Main application content component that handles routing and progress indication.
 */
function AppContent() {
  const location = useLocation();
  const [browserCompatibility, setBrowserCompatibility] = useState<BrowserCompatibility>({
    hasAudioSupport: false,
    hasMicrophonePermission: false,
    hasWaveSurferSupport: false
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-wedding-dark p-4">
      <div className="w-full max-w-2xl bg-wedding-dark border border-wedding-light/30 rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl text-center mb-4 sm:mb-6 md:mb-8 text-wedding-light tracking-heading">
          Marc & Sea's Wedding
        </h1>

        <BrowserCheck onCompatibilityChange={setBrowserCompatibility} />

        {browserCompatibility.hasAudioSupport && (
          <>
            <div className="space-y-4 sm:space-y-6">
              <Routes>
                <Route path="/" element={<Navigate to="/welcome" />} />
                <Route path="/welcome" element={<WelcomeView />} />
                <Route path="/recording" element={<RecordingView />} />
                <Route path="/upload" element={<UploadView />} />
                <Route path="/thankyou" element={<ThankYouView />} />
                <Route path="*" element={<Navigate to="/welcome" />} />
              </Routes>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8">
              <ProgressIndicator 
                currentState={(location.pathname.substring(1) || 'welcome') as RecordingState} 
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/**
 * Root application component managing the wedding message recording workflow.
 * 
 * This component orchestrates the core recording flow state machine and coordinates
 * between all sub-components using Context for state management.
 * 
 * Application Flow:
 * 1. Welcome (guest info collection)
 * 2. Recording (audio capture)
 * 3. Upload (progress tracking)
 * 4. Thank You (confirmation)
 */
function App() {
  return (
    <BrowserRouter>
      <RecordingProvider>
        <AppContent />
      </RecordingProvider>
    </BrowserRouter>
  );
}

export { AppContent };

export default App;
