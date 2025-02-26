# Marc With A Sea Wedding Website - Testing Plan

# Phase 1: Frontend Testing

## 1. Local Development Setup

```mermaid
graph TD
    A[Setup Environment] --> B[Start Frontend]
    B --> C[Access Application]
    C --> D[Begin Testing]
```

### Frontend Setup
- Run `npm run dev` in the project root to start the Vite development server
- This will serve the React application on http://localhost:5173
- No backend setup required for initial testing phase

## 2. Component Testing (Frontend Only)

### 2.1 Welcome Form (Priority: High)
- Test form validation:
  - Submit with empty name
  - Submit with valid name
  - Test optional email field validation

### 2.2 Audio Recording
- Test microphone permissions:
  - Allow permissions
  - Deny permissions (should show error)
- Test recording controls:
  - Start recording
  - Pause recording
  - Resume recording
  - Stop recording
- Test volume visualization:
  - Verify volume indicator responds to audio input
  - Verify waveform visualization works

### 2.3 Audio Playback
- Test playback controls:
  - Play recorded audio
  - Pause playback
  - Verify waveform visualization during playback
- Test audio quality:
  - Record sample messages of different lengths
  - Verify audio clarity and quality

### 2.4 Upload Functionality (Using Mock Implementation)
- Test upload process with mock implementation:
  - Verify upload UI flow
  - Test progress indicator
  - Check completion states
- Test error handling with simulated errors:
  - Network disconnection simulation
  - Generic error states
  - Retry functionality

### 2.5 UI States
- Test state transitions:
  - Welcome → Recording → Preview → Upload → Thank You
  - Test back navigation where applicable
  - Test cancel functionality

# Phase 2: Backend Integration
(To be implemented after frontend testing is complete)

## 3. Backend Setup and Testing
- Verify worker starts correctly
- Test R2 bucket configuration:
  - Create test bucket if not exists
  - Verify read/write permissions

### 3.2 API Endpoints
- Test `/upload` endpoint:
  - Send valid requests with proper authentication
  - Send requests with invalid authentication
  - Send malformed requests
  - Test file size limits

### 3.3 File Storage
- Verify files are stored correctly in R2
- Check metadata is properly attached to files
- Verify filename format follows the pattern: `timestamp-guest-name.webm`

## 4. Integration Testing

### 4.1 End-to-End Flow
- Complete the entire user journey:
  1. Enter guest information
  2. Record a message
  3. Preview and approve
  4. Upload to backend
  5. Verify thank you screen

### 4.2 Cross-Browser Testing
- Test on multiple browsers:
  - Chrome
  - Firefox
  - Safari
  - Edge
- Test on mobile devices:
  - iOS Safari
  - Android Chrome

## 5. Performance Testing

### 5.1 Recording Performance
- Test with long recordings (near 15-minute limit)
- Monitor memory usage during extended recordings
- Test with various audio input qualities

### 5.2 Upload Performance
- Test uploading large files
- Measure upload speeds and optimize if needed
- Test upload progress accuracy

## 6. Security Testing

### 6.1 Authentication
- Verify upload token validation works
- Test with invalid tokens
- Test with missing tokens

### 6.2 Input Validation
- Test with malformed input data
- Test with unexpected file types
- Test with extremely large files

## 7. Implementation Plan

To implement this testing plan:

1. **Set up local environment**:
   - Configure worker secrets for local development
   - Create test R2 bucket

2. **Complete backend implementation**:
   - Finish the upload functionality in the frontend
   - Connect to the worker backend

3. **Create test scripts**:
   - Automated tests for critical paths
   - Manual test checklist for UI verification

4. **Document test results**:
   - Track issues and fixes
   - Document browser compatibility
