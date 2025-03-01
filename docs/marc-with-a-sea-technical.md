---
tokens: 159
type: plan
atomic: true
---

# Marc With A Sea Wedding Website - Technical Details

## Audio Recording
- Format: WAV for best quality
- Maximum duration: 15 minutes
- Real-time visualization using Wavesurfer.js
- Filename format: `{timestamp}-{sanitized-guest-name}.wav`

### Waveform Visualization
- Window size: 3 seconds for optimal performance
- Update frequency: 50px/sec for smooth movement
- Configuration:
  * Disabled normalization to preserve raw audio data
  * Scrolling window mode instead of continuous accumulation
  * Fixed height with consistent scaling
- Performance considerations:
  * Avoid real-time audio normalization
  * Use fixed-size data windows for consistent memory usage
  * Post-process audio data for playback quality
  * Balance update frequency with visual smoothness

## Testing
A comprehensive testing plan has been created to ensure the application works correctly:
- Local development environment setup
- Component testing (Welcome Form, Audio Recording, Playback, Upload)
- Backend testing (Worker setup, API endpoints, File storage)
- Integration testing (End-to-end flow, Cross-browser compatibility)
- Performance testing (Recording, Upload)
- Security testing (Authentication, Input validation)

See [TESTING.md](../../marc-with-a-sea/TESTING.md) for the complete testing plan.

## Data Structure
```typescript
interface GuestInfo {
  name: string;
  email?: string; // Optional for notifications
}

interface MessageMetadata {
  guestName: string;
  timestamp: string;
  duration: number;
  originalFilename: string;
}

interface ViewProps {
  onNext: () => void;
  onBack: () => void;
  guestInfo: GuestInfo;
}

interface RecordingData {
  duration: number;
  timestamp: string;
  guestName: string;
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

## Form Validation
```typescript
const guestInfoSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional()
});

const recordingSchema = z.object({
  duration: z.number().min(1).max(900), // 15 minutes in seconds
  volume: z.number().min(0).max(1)
});
```

## UI States
1. Welcome (Name Input)
2. Recording (with visualization)
3. Preview & Playback
4. Upload
5. Thank You/Confirmation

## Links
- [Back to Main Project](marc-with-a-sea.md)
- [Architecture](marc-with-a-sea-architecture.md)
- [Development Progress](marc-with-a-sea-progress.md)
- [Back to Index](index.md)
