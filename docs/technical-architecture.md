# Marc With A Sea Wedding Website - Technical Architecture

This document provides a comprehensive overview of the technical implementation and architecture of the Marc With A Sea wedding website, a simple web application that allows wedding guests to record audio greetings.

## Project Overview

The application provides a streamlined user experience for wedding guests to:
1. Enter their name
2. Record an audio message (up to 15 minutes)
3. Upload the recording 
4. Receive confirmation

## Architecture Overview

### Frontend Architecture
- TypeScript + React SPA
- WaveSurfer.js for audio visualization
- TailwindCSS + HeadlessUI for styling
- React Context API for state management
- React Router for navigation

### Backend Architecture
- Cloudflare Worker for file uploads
- R2 storage for audio files
- TypeScript-based implementation

## File Structure

```
/
├── src/
│   ├── components/
│   │   ├── AudioRecorder.tsx
│   │   ├── AudioRecorderControl.tsx
│   │   ├── UploadProgress.tsx 
│   │   ├── CountdownTimer.tsx
│   │   ├── VolumeIndicator.tsx
│   │   ├── BrowserCheck.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ErrorModal.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── ThankYou.tsx
│   │   └── WelcomeForm.tsx
│   ├── context/
│   │   └── RecordingContext.tsx
│   ├── hooks/
│   │   ├── useAudioRecording.ts
│   │   └── useUpload.ts
│   ├── types/
│   │   └── index.ts
│   ├── views/
│   │   ├── RecordingView.tsx
│   │   ├── ThankYouView.tsx
│   │   ├── UploadView.tsx
│   │   └── WelcomeView.tsx
│   └── App.tsx
├── worker/
│   └── src/
│       └── index.ts
└── package.json
```

## Technical Implementation

### Audio Recording

- **Format**: WebM (using Opus codec)
- **Maximum duration**: 15 minutes
- **Real-time visualization**: Using WaveSurfer.js
- **Filename format**: `{timestamp}-{sanitized-guest-name}.webm`

#### Audio Recording Configuration

```typescript
{
  mimeType: 'audio/webm',
  audioBitsPerSecond: 128000,
  renderRecordedAudio: true,
  scrollingWaveform: true,
  scrollingWaveformWindow: 3,
  continuousWaveform: true,
  mediaRecorderTimeslice: 100
}
```

#### Waveform Visualization

- **Window size**: 3 seconds for optimal performance
- **Update frequency**: 50px/sec for smooth movement
- **Configuration**:
  * Disabled normalization to preserve raw audio data
  * Scrolling window mode instead of continuous accumulation
  * Fixed height with consistent scaling
- **Performance considerations**:
  * Avoid real-time audio normalization
  * Use fixed-size data windows for consistent memory usage
  * Post-process audio data for playback quality
  * Balance update frequency with visual smoothness

#### Volume Analysis

- Uses Web Audio API's AnalyserNode
- Provides real-time RMS volume calculations
- Logarithmic scaling for better representation of volume levels
- Configurable min/max decibel range (-40dB to -10dB for speech)

### Component Architecture

The audio recording functionality is split across multiple components:

1. **AudioRecorderControl**: Core recording functionality
   - Handles MediaRecorder and WaveSurfer integration
   - Manages recording state (start, pause, resume, stop)
   - Handles permission requests
   - Exposes controls via ref

2. **AudioRecorder**: User-facing interface
   - Uses AudioRecorderControl for functionality
   - Displays recording UI (buttons, timer)
   - Handles error states and UI feedback

3. **VolumeIndicator**: Shows volume levels
   - Visual feedback for input volume
   - Color-coded bars for optimal levels

4. **CountdownTimer**: Displays recording time
   - Shows elapsed time
   - Enforces 15-minute limit
   - Provides visual progress indicator

### State Management

The application uses React Context API for global state:

1. **RecordingContext**: Central state management
   - Tracks recording state across components
   - Manages navigation between views
   - Stores guest information and audio data
   - Handles upload state

2. **Navigation Flow**:
   ```
   welcome → recording → upload → thankyou
   ```

3. **Recording State**:
   - `idle`: No recording exists
   - `recording`: Active recording in progress
   - `paused`: Recording is temporarily paused
   - `completed`: Recording is finished
   - `error`: An error occurred during recording

### Worker Configuration

- **Security**: CORS headers for frontend access
- **Authentication**: Basic authentication with upload token
- **File handling**: Validation and metadata extraction
- **Storage**: R2 bucket for audio files

#### Upload Flow

1. Frontend creates a `FormData` object with:
   - Audio blob (WebM format)
   - Guest information (name)
   - Recording metadata (duration, timestamp)

2. Frontend sends this to the Worker with authentication token

3. Worker validates, processes, and stores the file in R2 bucket

## Data Structures

```typescript
interface GuestInfo {
  name: string;
}

interface MessageMetadata {
  guestName: string;
  timestamp: string;
  duration: number;
  originalFilename: string;
}

interface RecordingState {
  status: 'idle' | 'recording' | 'paused' | 'completed' | 'error';
  error?: Error;
  duration: number;
  volume: number;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: Error;
}

interface BrowserCompatibility {
  hasAudioSupport: boolean;
  hasMicrophonePermission: boolean;
  hasWaveSurferSupport: boolean;
}
```

## Testing

The application includes comprehensive testing:

- **Component Tests**: Testing UI rendering and interaction
- **Context Tests**: Verifying state management
- **Hook Tests**: Testing audio recording and upload functionality
- **View Tests**: Ensuring proper navigation and user flow
- **Worker Tests**: Verifying server-side functionality

## Deployment

The application is deployed on Cloudflare infrastructure:

- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Worker
- **Storage**: Cloudflare R2 bucket