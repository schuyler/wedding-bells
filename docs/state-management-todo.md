# State Management Implementation TODOs

```mermaid
gantt
    title State Management Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    React Router Setup       :active, p1, 2025-03-01, 1d
    section Phase 2
    Context Implementation   :p2, after p1, 2d
    section Phase 3
    Component Updates        :p3, after p2, 2d
    section Phase 4
    Testing/Refinement       :p4, after p3, 1d
```

## Completed Items ✓
- [x] Install react-router-dom@6.18+
- [x] Create `src/views` directory structure
- [x] Create `src/context/RecordingContext.tsx`
- [x] Implement core state machine logic
- [x] Add browser history integration
- [x] Create view components for each route
- [x] Convert App.tsx to use BrowserRouter
- [x] Basic route guards implementation

## Immediate Priority - Unit Testing

### Infrastructure Setup (Required for all tests)
- [x] Install test dependencies
  - [x] vitest
  - [x] @testing-library/react
  - [x] @testing-library/user-event
  - [x] @testing-library/jest-dom
  - [x] happy-dom
  - [x] @vitest/coverage-c8
- [x] Configure test environment
  - [x] Create vitest.config.ts
  - [x] Set up test utils directory structure
  - [x] Create test setup file
  - [x] Configure coverage reporting

### Primary Test Implementation
- [x] Write unit tests for RecordingContext navigation methods
  - [x] Test linear flow restrictions
  - [x] Test history integration
  - [x] Test state preservation
  - [x] Test invalid transitions

- [x] Write unit tests for state transitions in RecordingContext
  - [x] Test recording state changes
  - [x] Test guest info updates
  - [x] Test audio blob management
  - [x] Test error state handling

- [x] Write unit tests for view component redirects
  - [x] Test missing state redirects
  - [ ] Test permission-based access
    - [ ] Test RecordingView with denied microphone permissions
    - [ ] Test permission request UI elements
    - [ ] Test permission state transitions
    - [ ] Test error messages for permission denial
    - [ ] Test recovery flow when permissions are granted
  - [x] Test navigation guards
  - [x] Test basic component rendering and interactions

- [x] Write unit tests for useAudioRecording hook
  - [x] Test initialization
  - [x] Test volume analysis
  - [x] Test cleanup behavior
  - [x] Test error states

- [x] Write unit tests for utility functions in components
  - [x] Test format functions (in CountdownTimer.test.tsx)
  - [x] Test validation functions
  - [x] Test audio processing utils (in useAudioRecording.test.ts)
  - [ ] Test file handling utils

- [x] Create test harness for MediaStream mocking
  - [x] Mock audio input simulation (basic implementation in useAudioRecording.test.ts)
  - [x] Mock volume level control (simulateAudioData in useAudioRecording.test.ts)
  - [x] Mock error injection (in useAudioRecording.test.ts)
  - [ ] Mock event timing
  - [ ] Create comprehensive MediaStreamMock class with full API implementation
  - [ ] Add support for simulating different audio input devices
  - [ ] Implement dynamic volume level simulation for realistic testing
  - [ ] Create helper functions for common MediaStream test scenarios
  - [ ] Add documentation for MediaStream mocking patterns

- [x] Add test coverage reporting
  - [x] Configure coverage thresholds
  - [x] Set up coverage reports
  - [ ] Add coverage badges
  - [x] Document coverage requirements

## Testing & QA
- [ ] Implement navigation flow tests
  - [x] Test basic navigation sequence
  - [ ] Test complete recording flow with required state
  - [ ] Test navigation between all views
  - [ ] Test non-linear navigation attempts
  - [ ] Test route guard effectiveness
  - [ ] Create end-to-end test for happy path flow
  - [ ] Test navigation with simulated user interactions
  - [ ] Test navigation with keyboard controls
  - [ ] Test navigation accessibility compliance
  - [ ] Create test fixtures for common navigation scenarios

- [ ] Verify browser back/forward behavior
  - [ ] Test history stack management
  - [ ] Test state sync with history
  - [ ] Test deep linking behavior
  - [ ] Test navigation interruption
  - [ ] Test browser refresh during navigation flow
  - [ ] Test history state preservation with complex objects
  - [ ] Test URL parameter handling during navigation
  - [ ] Test history manipulation edge cases
  - [ ] Create test utilities for history state verification

- [ ] Test recording state persistence
  - [ ] Test state preservation during navigation
  - [ ] Test state recovery after page refresh
  - [ ] Test state cleanup on flow reset
  - [ ] Test concurrent session handling
  - [ ] Test localStorage persistence mechanisms
  - [ ] Test sessionStorage fallback strategies
  - [ ] Test state migration between storage versions
  - [ ] Test state recovery from corrupted storage
  - [ ] Create utilities for state persistence testing

- [ ] Error handling coverage
  - [x] Test invalid state transitions
  - [ ] Test network failure scenarios
  - [ ] Test API error responses
  - [ ] Test recovery procedures

- [ ] Test permission handling scenarios
  - [ ] Test initial permission requests
  - [ ] Test permission denial flows
  - [ ] Test permission revocation
  - [ ] Test re-request scenarios
  - [ ] Test permission UI feedback mechanisms
  - [ ] Test permission state persistence
  - [ ] Test device change handling during recording
  - [ ] Test browser-specific permission behaviors
  - [ ] Create permission testing utilities

- [x] Test visualization state management
  - [x] Test waveform rendering (in WaveformVisualizer.test.tsx)
  - [x] Test visualization updates (in WaveformVisualizer.test.tsx)
  - [ ] Test state synchronization
  - [ ] Test memory management

- [ ] Performance testing for visualization updates
  - [ ] Measure render performance
  - [ ] Test high-load scenarios
  - [ ] Profile memory usage
  - [ ] Test device limitations

- [ ] Test audio quality and encoding
  - [ ] Test various audio inputs
  - [ ] Verify encoding quality
  - [ ] Test file size optimization
  - [ ] Validate playback quality

## High Priority - Recording Engine Abstraction
- [ ] Create `src/services/RecordingEngine.ts` interface and implementation
- [ ] Migrate MediaRecorder logic from WaveformVisualizer to RecordingEngine
- [ ] Implement permission handling in RecordingEngine
- [ ] Add unified error handling system
- [ ] Create RecordingEngineProvider context
- [ ] Update AudioRecorder to use RecordingEngine
- [ ] Write unit tests for RecordingEngine

## High Priority - WaveformVisualizer Integration
- [ ] Refactor WaveformVisualizer to be purely presentational
- [ ] Create WaveformVisualizerContext for state management
- [ ] Implement declarative API for WaveformVisualizer
- [ ] Add proper TypeScript interfaces for visualization state
- [ ] Create visualization state reducer
- [ ] Write integration tests for WaveformVisualizer

## Documentation
- [ ] Update technical documentation with new architecture
- [ ] Document RecordingEngine API
- [ ] Document visualization state management
- [x] Add inline documentation for context usage
- [x] Document error handling approaches
- [ ] Create example usage documentation
- [ ] Update architecture diagrams

## Future Improvements
- [ ] Consider transition animations
- [ ] Explore performance optimizations
- [ ] Add comprehensive error logging
- [ ] Consider WebAssembly for audio processing
- [ ] Add support for different audio formats
- [ ] Implement advanced waveform visualization options
