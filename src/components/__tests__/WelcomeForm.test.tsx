import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeAll, afterEach, beforeEach, afterAll } from 'vitest'
import { WelcomeForm } from '../WelcomeForm'
import { MediaStreamMock } from '../../test/mocks/media-stream.mock'
import { render } from '../../test/test-utils'
import { useEffect } from 'react'

// Mock getUserMedia API
const mockGetUserMedia = vi.fn()
// Mock console.error to keep test output clean
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia
    },
    writable: true
  })
})

afterEach(() => {
  mockGetUserMedia.mockReset()
  vi.clearAllMocks()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock BrowserCheck component
vi.mock('../BrowserCheck', () => ({
  BrowserCheck: ({ onCompatibilityChange }: { onCompatibilityChange: (compat: any) => void }) => {
    useEffect(() => {
      onCompatibilityChange({
        hasAudioSupport: true,
        hasMicrophonePermission: false,
        hasWaveSurferSupport: true
      })
    }, [onCompatibilityChange])
    return null
  }
}))

describe('WelcomeForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockReset()
  })

  it('renders the form with required elements', () => {
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Verify heading
    expect(screen.getByRole('heading', { name: /record a message for the podcast/i }))
      .toBeInTheDocument()
    
    // Verify name input field
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    
    // Verify submit button
    expect(screen.getByRole('button', { name: /continue/i }))
      .toBeInTheDocument()
  })

  it('shows validation error when submitting without a name', async () => {
    const user = userEvent.setup()
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Submit the form without entering a name
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Wait for and verify error message
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
    
    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows error modal when microphone access is denied', async () => {
    const user = userEvent.setup()
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Enter a valid name
    await user.type(screen.getByLabelText(/your name/i), 'John Doe')
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Wait for error modal
    await waitFor(() => {
      expect(screen.getByText(/microphone access required/i)).toBeInTheDocument()
      expect(screen.getByText(/please allow microphone access/i)).toBeInTheDocument()
    })
    
    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits form successfully with valid name', async () => {
    const user = userEvent.setup()
    mockGetUserMedia.mockResolvedValue(new MediaStreamMock())
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Enter a valid name
    await user.type(screen.getByLabelText(/your name/i), 'John Doe')
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Wait for microphone check to complete and form to submit
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe'
      })
    })
    
    // Verify getUserMedia was called with audio
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('handles "Try Again" button click after microphone access denied', async () => {
    const user = userEvent.setup()
    mockGetUserMedia
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce(new MediaStreamMock())
    
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Enter name and submit
    await user.type(screen.getByLabelText(/your name/i), 'John Doe')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Wait for error modal
    await waitFor(() => {
      expect(screen.getByText(/microphone access required/i)).toBeInTheDocument()
    })
    
    // Click Try Again button
    await user.click(screen.getByRole('button', { name: /try again/i }))
    
    // Verify form submits after successful retry
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe'
      })
    })
  })

  it('clears error state when microphone permission is granted via browser check', async () => {
    const user = userEvent.setup()
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
    
    const { rerender } = render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Enter name and submit
    await user.type(screen.getByLabelText(/your name/i), 'John Doe')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Wait for error modal
    await waitFor(() => {
      expect(screen.getByText(/microphone access required/i)).toBeInTheDocument()
    })
    
    // Update compatibility state with microphone permission
    rerender(
      <WelcomeForm onSubmit={mockOnSubmit} />
    )
    
    // Verify error modal is closed
    await waitFor(() => {
      expect(screen.queryByText(/microphone access required/i)).not.toBeInTheDocument()
    })
  })

  it('shows loading state while checking microphone access', async () => {
    const user = userEvent.setup()
    mockGetUserMedia.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new MediaStreamMock()), 100))
    )
    
    render(<WelcomeForm onSubmit={mockOnSubmit} />)
    
    // Enter name and submit
    await user.type(screen.getByLabelText(/your name/i), 'John Doe')
    await user.click(screen.getByRole('button', { name: /continue/i }))
    
    // Verify loading state
    expect(screen.getByText(/checking microphone.../i)).toBeInTheDocument()
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/checking microphone.../i)).not.toBeInTheDocument()
    })
  })
})
