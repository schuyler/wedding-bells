import { useState } from 'react'
import { WelcomeForm } from './components/WelcomeForm'
import { AudioRecorder } from './components/AudioRecorder'
import { ProgressIndicator } from './components/ProgressIndicator'
import { UploadProgress } from './components/UploadProgress'
import { ThankYou } from './components/ThankYou'
import { BrowserCheck } from './components/BrowserCheck'
import { GuestInfo, RecordingState, BrowserCompatibility } from './types'

/**
 * Root application component managing the wedding message recording workflow.
 * 
 * This component orchestrates the core recording flow state machine and coordinates
 * between all sub-components. It follows the State Machine pattern with explicit
 * transitions between phases.
 * 
 * Application Flow:
 * 1. Welcome (guest info collection)
 * 2. Recording (audio capture)
 * 3. Preview (audio review) - TODO: Implement in Phase 3
 * 4. Upload (progress tracking)
 * 5. Thank You (confirmation)
 * 
 * Key Responsibilities:
 * - Maintains core application state and phase transitions
 * - Handles cross-component communication via props
 * - Manages browser compatibility checks
 * - Provides mock upload functionality until Phase 4 implementation
 * 
 * Technical Architecture:
 * - Uses React useState for simple state management 
 * - Implements prop drilling pattern temporarily (will be replaced with context API)
 * - Follows Atomic Design principles for component composition
 * 
 * Technical Debt Inventory:
 * [High] State Management:
 *   - Current useState implementation leads to prop drilling
 *   - Phase 4 may implement XState finite state machine?
 *   - Mitigation: Temporary context API wrapper added in v1.2
 * 
 * [Critical] Upload Implementation:
 *   - Mock upload doesn't handle errors or retries
 *   - Production requires Tus protocol (RFC 7233)
 *   - Mitigation: Phase 4 engineering spike scheduled
 * 
 * [Medium] Preview Phase:
 *   - Placeholder UI exists (see Phase 3)
 *   - Requires WaveSurfer.js integration
 *   - Missing audio validation logic
 * 
 * Architectural Constraints:
 * 1. Browser Feature Detection:
 *    - Compatibility checks duplicated in 3 components
 *    - Will be centralized in Phase 4.1
 * 2. Mobile Responsiveness:
 *    - Tailwind breakpoints not fully implemented
 */
function App() {
  const [recordingState, setRecordingState] = useState<RecordingState>('welcome')
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [browserCompatibility, setBrowserCompatibility] = useState<BrowserCompatibility>({
    hasAudioSupport: false,
    hasMicrophonePermission: false,
    hasWaveSurferSupport: false
  })

  const handleGuestInfo = (info: GuestInfo) => {
    setGuestInfo(info)
    setRecordingState('recording')
  }

  /**
   * Handles completion of audio recording
   * @param {Blob} blob - Recorded audio data in WAV format
   * @sideeffect
   * - Stores audio blob in state
   * - Transitions to preview phase
   * @validation
   * - Assumes valid audio blob from recorder
   * - No duration/quality checks implemented
   */
  const handleAudioComplete = (blob: Blob) => {
    setAudioBlob(blob)
    setRecordingState('preview')
  }

  /**
   * Resets application state to initial values
   * @sideeffect
   * - Resets all state variables
   * - Returns to welcome phase
   * @usage
   * - Called on recording cancellation
   * - Called after successful upload
   * @technicalDebt
   * - Hard reset instead of granular state management
   */
  const handleCancel = () => {
    setRecordingState('welcome')
    setGuestInfo(null)
    setAudioBlob(null)
    setUploadProgress(0)
  }

  /**
   * Simulates file upload progress
   * @sideeffect
   * - Manages mock upload interval
   * - Updates progress percentage
   * - Transitions to thank you phase on completion
   * @technicalDebt
   * - Uses setInterval mock instead of real upload
   * - No error handling
   * - Fixed progression rate (10%/500ms)
   */
  const handleStartUpload = () => {
    setRecordingState('upload')
    // Mock upload progress for now - will be replaced in Phase 4
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setRecordingState('thankyou')
      }
    }, 500)
  }

  /**
   * Resets state for new recording while preserving browser compatibility
   * @sideeffect
   * - Resets guest info and recording state
   * - Maintains browser compatibility checks
   * @differenceFromHandleCancel
   * - Does NOT reset browserCompatibility state
   */
  const handleRecordAnother = () => {
    setRecordingState('welcome')
    setGuestInfo(null)
    setAudioBlob(null)
    setUploadProgress(0)
  }

  /**
   * Determines UI component based on current state
   * @returns {JSX.Element} Component for current phase
   * @logic
   * - Uses switch statement over recordingState
   * - Returns appropriate phase component
   * @errorConditions
   * - Fails silently if guestInfo missing in required states
   */
  const renderCurrentState = () => {
    switch (recordingState) {
      case 'welcome':
        return <WelcomeForm onSubmit={handleGuestInfo} />
      case 'recording':
        return guestInfo && (
          <AudioRecorder
            onRecordingComplete={handleAudioComplete}
            onCancel={handleCancel}
          />
        )
      case 'preview':
        return (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Preview coming in Phase 3...
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleStartUpload}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      case 'upload':
        return guestInfo?.name && audioBlob && (
          <UploadProgress
            fileName={`${guestInfo.name}'s Message.wav`}
            progress={uploadProgress}
            status={uploadProgress < 100 ? 'uploading' : 'completed'}
            onComplete={() => setRecordingState('thankyou')}
          />
        )
      case 'thankyou':
        return guestInfo?.name ? (
          <ThankYou
            guestName={guestInfo.name}
            onRecordAnother={handleRecordAnother}
          />
        ) : null
    }
  }

  return (
    /** 
     * Main application container
     * @styledComponent
     * @responsive
     * - Uses Tailwind responsive classes
     * - Centered layout
     * - Gradient background
     */
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-gray-800">
          Marc & Sea's Wedding
        </h1>
        
        <BrowserCheck onCompatibilityChange={setBrowserCompatibility} />
        
        {browserCompatibility.hasAudioSupport && (
          <>
            <div className="space-y-4 sm:space-y-6">
              {renderCurrentState()}
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8">
              <ProgressIndicator currentState={recordingState} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default App
