import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserCheck } from '../BrowserCheck'

describe('BrowserCheck', () => {
  it('renders without crashing', () => {
    const onCompatibilityChange = vi.fn()
    render(<BrowserCheck onCompatibilityChange={onCompatibilityChange} />)
  })

  it('renders "Browser Not Supported" message when audio support is not available', () => {
    const originalAudioContext = window.AudioContext
    const originalMediaRecorder = window.MediaRecorder
    // Mock the window.AudioContext and window.MediaRecorder
    // @ts-expect-error
    delete window.AudioContext
    // @ts-expect-error
    delete window.MediaRecorder

    const onCompatibilityChange = vi.fn()
    render(<BrowserCheck onCompatibilityChange={onCompatibilityChange} />)

    expect(screen.getByText('Browser Not Supported')).toBeInTheDocument()

    // Restore the original window.AudioContext and window.MediaRecorder
    window.AudioContext = originalAudioContext
    window.MediaRecorder = originalMediaRecorder
  })

  it('calls onCompatibilityChange with correct compatibility information', () => {
    const onCompatibilityChange = vi.fn()
    const originalAudioContext = window.AudioContext
    const originalMediaRecorder = window.MediaRecorder

    // Restore the original window.AudioContext and window.MediaRecorder
    window.AudioContext = originalAudioContext
    window.MediaRecorder = originalMediaRecorder

    render(<BrowserCheck onCompatibilityChange={onCompatibilityChange} />)

    expect(onCompatibilityChange).toHaveBeenCalledTimes(1)
    expect(onCompatibilityChange).toHaveBeenCalledWith({
      hasAudioSupport: true,
      hasMicrophonePermission: false,
      hasWaveSurferSupport: true,
    })
  })

  it('renders null when audio support is available', () => {
    const onCompatibilityChange = vi.fn()
    const { container } = render(<BrowserCheck onCompatibilityChange={onCompatibilityChange} />)
    expect(container.firstChild).toBeNull()
  })
})
