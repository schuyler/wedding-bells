import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThankYou } from '../ThankYou'

// Mock the window.navigator.share function
let mockShare;
if (typeof globalThis.navigator.share !== 'undefined') {
  mockShare = vi.fn();
  globalThis.navigator.share = mockShare;
}

describe('ThankYou Component', () => {
  it('renders without crashing', () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
  })

  it('displays the correct thank you message with the guest name', () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
    expect(screen.getByText('Thank You, Test Guest!')).toBeInTheDocument()
  })

  it('calls the onRecordAnother function when the "Record Another Message" button is clicked', () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
    const recordAnotherButton = screen.getByText('Record Another Message')
    fireEvent.click(recordAnotherButton)
    expect(onRecordAnother).toHaveBeenCalledTimes(1)
  })

  it('successfully uses the share API when available', async () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
    const shareButton = screen.getByText('Share')

    // Mock the window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
    })

    // Mock the share API
    const mockShare = vi.fn().mockResolvedValue(undefined)
    globalThis.navigator.share = mockShare

    await fireEvent.click(shareButton)
    
    expect(mockShare).toHaveBeenCalledTimes(1)
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Wedding Message Recorded',
      text: 'I just recorded a message for Marc & Sea\'s wedding! 🎉 #WavesOfLove',
      url: 'http://localhost:3000',
    })
  })

  it('successfully uses clipboard API when share API is not available', async () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
    const shareButton = screen.getByText('Share')

    // Mock the window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
    })

    // Mock clipboard API
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    globalThis.navigator.clipboard.writeText = mockWriteText

    // Mock alert
    const mockAlert = vi.fn()
    globalThis.alert = mockAlert

    // Remove share API by making it undefined
    Object.defineProperty(globalThis.navigator, 'share', {
      value: undefined,
      writable: true
    })

    await fireEvent.click(shareButton)
    
    expect(mockWriteText).toHaveBeenCalledTimes(1)
    expect(mockWriteText).toHaveBeenCalledWith(
      `I just recorded a message for Marc & Sea's wedding! 🎉 #WavesOfLove\nhttp://localhost:3000`
    )
    expect(mockAlert).toHaveBeenCalledTimes(1)
    expect(mockAlert).toHaveBeenCalledWith('Link copied to clipboard!')
  })

  it('displays an alert when the "Share" button is clicked and the share API is not available', async () => {
    const onRecordAnother = vi.fn()
    render(<ThankYou guestName="Test Guest" onRecordAnother={onRecordAnother} />)
    const shareButton = screen.getByText('Share')

    // Mock the window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
    })

    // Mock the navigator.clipboard.writeText function
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    globalThis.navigator.clipboard.writeText = mockWriteText

    // Mock the alert function
    const mockAlert = vi.fn()
    globalThis.alert = mockAlert

    // Test when share API is not available
    await fireEvent.click(shareButton)
    expect(mockAlert).toHaveBeenCalledTimes(1)
    expect(mockAlert).toHaveBeenCalledWith('Link copied to clipboard!')
  })
})
