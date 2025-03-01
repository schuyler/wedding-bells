---
tokens: 126
type: plan
atomic: true
---

# Marc With A Sea Wedding Website - Architecture

## Frontend Architecture
- TypeScript + React SPA
- Wavesurfer.js for audio visualization
- TailwindCSS + HeadlessUI for styling
- 15-minute maximum recording duration
- Simple guest name collection
- Real-time audio visualization

## Backend Architecture
- Cloudflare Worker for file uploads
- R2 storage for audio files
- TypeScript-based implementation

## Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "wavesurfer.js": "^7.9.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.1",
    "@headlessui/react": "^2.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-use": "^17.6.0",
    "zod": "^3.24.2"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "vite": "latest",
    "typescript": "latest",
    "wrangler": "latest",
    "@cloudflare/workers-types": "latest",
    "@types/node": "latest",
    "prettier": "latest",
    "eslint": "latest",
    "@typescript-eslint/parser": "latest",
    "@typescript-eslint/eslint-plugin": "latest"
  }
}
```

## File Structure
```
/
├── src/
│   ├── components/
│   │   ├── AudioRecorder.tsx
│   │   ├── WaveformVisualizer.tsx
│   │   ├── UploadProgress.tsx 
│   │   ├── CountdownTimer.tsx
│   │   ├── VolumeIndicator.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── BrowserCheck.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ErrorModal.tsx
│   │   └── PermissionPrompt.tsx
│   ├── hooks/
│   │   ├── useAudioRecording.ts
│   │   └── useFormValidation.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── worker/
│   └── src/
│       └── index.ts
└── package.json
```

## Technical Configuration

### WaveSurfer Record Plugin Configuration
```typescript
{
  mimeType: 'audio/webm',
  audioBitsPerSecond: 128000,
  renderRecordedAudio: true,
  scrollingWaveform: true,
  scrollingWaveformWindow: 5,
  continuousWaveform: true,
  mediaRecorderTimeslice: 100
}
```

### Volume Analysis
- Kept separate from recording functionality
- Uses Web Audio API's AnalyserNode
- Provides real-time RMS volume calculations
- Clean resource management with proper cleanup

### Worker Configuration
- CORS headers for frontend access
- Basic authentication with upload token
- File validation and metadata handling
- Chunked upload support

## Links
- [Back to Main Project](marc-with-a-sea.md)
- [Technical Details](marc-with-a-sea-technical.md)
- [Development Progress](marc-with-a-sea-progress.md)
- [Back to Index](index.md)
