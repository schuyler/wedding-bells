import { useState } from 'react'
import { WelcomeForm } from './components/WelcomeForm'
import { AudioRecorder } from './components/AudioRecorder'
import { ProgressIndicator } from './components/ProgressIndicator'
import { UploadProgress } from './components/UploadProgress'
import { ThankYou } from './components/ThankYou'
import { BrowserCheck } from './components/BrowserCheck'
import { GuestInfo, RecordingState, BrowserCompatibility } from './types'

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

  const handleAudioComplete = (blob: Blob) => {
    setAudioBlob(blob)
    setRecordingState('preview')
  }

  const handleCancel = () => {
    setRecordingState('welcome')
    setGuestInfo(null)
    setAudioBlob(null)
    setUploadProgress(0)
  }

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

  const handleRecordAnother = () => {
    setRecordingState('welcome')
    setGuestInfo(null)
    setAudioBlob(null)
    setUploadProgress(0)
  }

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
