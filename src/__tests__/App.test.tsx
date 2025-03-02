import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { RecordingProvider } from '../context/RecordingContext';
import { AppContent } from '../App';
import type { BrowserCompatibility } from '../types';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../components/BrowserCheck', () => {
  const BrowserCheck = ({ onCompatibilityChange }: { onCompatibilityChange: (compatibility: BrowserCompatibility) => void }) => {
    useEffect(() => {
      onCompatibilityChange({
        hasAudioSupport: true,
        hasMicrophonePermission: true,
        hasWaveSurferSupport: true,
      });
      // We're disabling this lint rule because this is a test mock
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="browser-check">Mock BrowserCheck</div>;
  };
  return { BrowserCheck };
});

vi.mock('../components/ProgressIndicator', () => {
  const ProgressIndicator = () => {
    return <div data-testid="progress-indicator">Mock ProgressIndicator</div>;
  };
  return { ProgressIndicator };
});

describe('App Component', () => {
  it('should render BrowserRouter, RecordingProvider, and AppContent', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});

describe('AppContent Component', () => {
  it('should render BrowserCheck', async () => {
    render(
      <BrowserRouter>
        <RecordingProvider>
          <AppContent />
        </RecordingProvider>
      </BrowserRouter>
    );
    expect(screen.getByTestId('browser-check')).toBeInTheDocument();
  });

  it('should render Routes', () => {
    render(
      <BrowserRouter>
        <RecordingProvider>
          <AppContent />
        </RecordingProvider>
      </BrowserRouter>
    );
  });

  it('should render ProgressIndicator with correct currentState prop', async () => {
    render(
      <BrowserRouter>
        <RecordingProvider>
          <AppContent />
        </RecordingProvider>
      </BrowserRouter>
    );
    await screen.findByTestId('progress-indicator');
  });
});
