import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { UploadProgress } from '../UploadProgress'

describe('UploadProgress Component', () => {
  it('renders without crashing', () => {
    render(<UploadProgress progress={0} status="idle" />)
  })

  it('renders correct status message and icon for each state (idle, uploading, completed, error)', async () => {
    const { rerender } = render(<UploadProgress progress={0} status="idle" />);
    expect(screen.getByText('Preparing to upload...')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar')[1]).toBeInTheDocument();

    await act(async () => {
      rerender(<UploadProgress progress={50} status="uploading" />);
    });
    expect(screen.getByText('Uploading your message...')).toBeInTheDocument();

    await act(async () => {
      rerender(<UploadProgress progress={100} status="completed" />);
    });
    expect(screen.getByText('Upload complete!')).toBeInTheDocument();

    await act(async () => {
      rerender(<UploadProgress progress={0} status="error" error="Upload failed" />);
    });
    expect(screen.getAllByText('Upload failed')[0]).toBeInTheDocument();
  });

  it('renders ProgressBar with correct progress and variant', async () => {
    const { rerender } = render(<UploadProgress progress={50} status="uploading" />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveClass('bg-blue-500');

    await act(async () => {
      rerender(<UploadProgress progress={100} status="completed" />);
    });
    expect(progressBar).toHaveClass('bg-green-500');

    await act(async () => {
      rerender(<UploadProgress progress={0} status="error" error="Upload failed" />);
    });
    expect(progressBar).toHaveClass('bg-yellow-500');
  });

  it('renders ErrorModal when error prop is present', async () => {
    const { rerender } = render(<UploadProgress progress={0} status="error" error="Upload failed" />);
    await act(async () => {
      rerender(<UploadProgress progress={0} status="error" error="Upload failed" />);
    });
    expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    expect(screen.getAllByText('Upload failed')[0]).toBeInTheDocument();
  });

  it('renders "Continue" button when status is "completed"', () => {
    render(<UploadProgress progress={100} status="completed" onComplete={() => {}} />)
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('does not render "Continue" button when status is not "completed"', () => {
    render(<UploadProgress progress={50} status="uploading" />)
    expect(() => screen.getByText('Continue')).toThrowError()
  })

  it('calls onRetry when "Retry Upload" button is clicked', async () => {
    const onRetry = vi.fn();
    render(<UploadProgress progress={0} status="error" error="Upload failed" onRetry={onRetry} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Retry Upload'));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when "Continue" button is clicked', async () => {
    const onComplete = vi.fn();
    render(<UploadProgress progress={100} status="completed" onComplete={onComplete} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Continue'));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
