import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CountdownTimer } from '../CountdownTimer'

describe('CountdownTimer', () => {
  // Mock timers for predictable testing
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatTime utility function', () => {
    // We need to test the formatTime function which is internal to the component
    // We can test it indirectly by rendering the component and checking the output

    it('formats seconds correctly with zero padding', () => {
      render(<CountdownTimer duration={65} running={false} />)
      expect(screen.getByText('1:05')).toBeInTheDocument()
    })

    it('formats minutes and seconds correctly', () => {
      render(<CountdownTimer duration={125} running={false} />)
      expect(screen.getByText('2:05')).toBeInTheDocument()
    })

    it('handles single-digit minutes correctly', () => {
      render(<CountdownTimer duration={540} running={false} />)
      expect(screen.getByText('9:00')).toBeInTheDocument()
    })

    it('handles double-digit minutes correctly', () => {
      render(<CountdownTimer duration={600} running={false} />)
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    it('handles zero seconds correctly', () => {
      render(<CountdownTimer duration={0} running={false} />)
      expect(screen.getByText('0:00')).toBeInTheDocument()
    })
  })

  describe('timer functionality', () => {
    it('updates time correctly when running', () => {
      const onComplete = vi.fn()
      
      // Use act to wrap the initial render
      let rerender: (ui: React.ReactElement) => void
      act(() => {
        const result = render(<CountdownTimer duration={10} running={true} onComplete={onComplete} />)
        rerender = result.rerender
      })
      
      // Initial state
      expect(screen.getByText('0:10')).toBeInTheDocument()
      
      // Advance time by 5 seconds and force a re-render
      act(() => {
        vi.advanceTimersByTime(5000)
        rerender(<CountdownTimer duration={10} running={true} onComplete={onComplete} />)
      })
      
      expect(screen.getByText('0:05')).toBeInTheDocument()
      
      // Advance to completion and force a re-render
      act(() => {
        vi.advanceTimersByTime(5000)
        rerender(<CountdownTimer duration={10} running={true} onComplete={onComplete} />)
      })
      
      expect(screen.getByText('0:00')).toBeInTheDocument()
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('does not update time when not running', () => {
      render(<CountdownTimer duration={10} running={false} />)
      
      // Initial state
      expect(screen.getByText('0:10')).toBeInTheDocument()
      
      // Advance time
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      
      // Time should not change
      expect(screen.getByText('0:10')).toBeInTheDocument()
    })
  })

  describe('color transitions', () => {
    it('uses blue color for normal time remaining', () => {
      render(<CountdownTimer duration={100} running={false} />)
      const timeElement = screen.getByText('1:40')
      expect(timeElement).toHaveClass('text-blue-500')
    })

    it('uses yellow color for warning time remaining', () => {
      // Set duration to 100, simulate 75% elapsed (25% remaining)
      let rerender: (ui: React.ReactElement) => void
      
      act(() => {
        const result = render(<CountdownTimer duration={100} running={true} />)
        rerender = result.rerender
      })
      
      // Advance time to 75% elapsed
      act(() => {
        vi.advanceTimersByTime(75000)
        rerender(<CountdownTimer duration={100} running={true} />)
      })
      
      const timeElement = screen.getByText('0:25')
      expect(timeElement).toHaveClass('text-yellow-500')
    })

    it('uses red color for critical time remaining', () => {
      // Set duration to 100, simulate 95% elapsed (5% remaining)
      let rerender: (ui: React.ReactElement) => void
      
      act(() => {
        const result = render(<CountdownTimer duration={100} running={true} />)
        rerender = result.rerender
      })
      
      // Advance time to 95% elapsed
      act(() => {
        vi.advanceTimersByTime(95000)
        rerender(<CountdownTimer duration={100} running={true} />)
      })
      
      const timeElement = screen.getByText('0:05')
      expect(timeElement).toHaveClass('text-red-500')
    })
  })
})
