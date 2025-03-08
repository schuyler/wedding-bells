# State Management Implementation

This document describes the current state management approach in the Marc With A Sea wedding application.

## Current Implementation

The application uses a combination of:

1. **React Router** - For URL-based navigation
2. **Context API** - For global state management
3. **Component State** - For local UI state

### Navigation Flow

The application follows a linear navigation flow:

```
welcome → recording → upload → thankyou
```

With allowed transitions:
- Forward: Move to the next step in sequence
- Backward: Move to the previous step in sequence
- Reset: Return to welcome from any step (cancel)
- Restart: Return to welcome after completion (record another)

### Recording State Management

The recording state is managed through the RecordingContext, which centralizes:

- Guest information management
- Recording status tracking
- Audio blob storage
- Upload state

### Components Structure

Views are structured to interact with the RecordingContext:

1. **WelcomeView** - Collects guest information
2. **RecordingView** - Manages audio recording
3. **UploadView** - Handles file upload
4. **ThankYouView** - Shows confirmation

## Testing

The application has unit tests covering:
- RecordingContext navigation methods
- State transitions
- View component redirects
- Audio recording hook functionality

## Future Enhancements

Some aspects of the planned state management architecture are still being implemented:

1. Improving browser back/forward button support
2. Enhanced recording state persistence
3. Comprehensive error handling
4. Advanced permission handling

See the CLAUDE.md file for development guidelines and workflows.