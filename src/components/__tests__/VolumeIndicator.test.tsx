import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { VolumeIndicator } from '../VolumeIndicator'

describe('VolumeIndicator', () => {
  it('renders 10 volume bars', () => {
    const { container } = render(<VolumeIndicator volume={0} />)
    const bars = container.querySelectorAll('.w-1\\.5')
    expect(bars.length).toBe(10)
  })

  it('renders all gray bars at volume 0', () => {
    const { container } = render(<VolumeIndicator volume={0} />)
    const bars = container.querySelectorAll('.w-1\\.5')
    expect(bars.length).toBe(10)
    bars.forEach(bar => {
      expect(bar).toHaveClass('bg-gray-200')
    })
  })

  it('renders correct colors at medium volume (0.5)', () => {
    const { container } = render(<VolumeIndicator volume={0.5} />)
    const bars = container.querySelectorAll('.w-1\\.5')
    
    // First 5 should be green
    for (let i = 0; i < 5; i++) {
      expect(bars[i]).toHaveClass('bg-green-500')
    }
    
    // Rest should be gray
    for (let i = 5; i < 10; i++) {
      expect(bars[i]).toHaveClass('bg-gray-200')
    }
  })

  it('renders yellow warning bars at high volume (0.8)', () => {
    const { container } = render(<VolumeIndicator volume={0.8} />)
    const bars = container.querySelectorAll('.w-1\\.5')
    
    // First 7 should be green
    for (let i = 0; i < 7; i++) {
      expect(bars[i]).toHaveClass('bg-green-500')
    }
    
    // 8th bar should be yellow
    expect(bars[7]).toHaveClass('bg-yellow-500')
    
    // Rest should be gray
    for (let i = 8; i < 10; i++) {
      expect(bars[i]).toHaveClass('bg-gray-200')
    }
  })

  it('renders red danger bar at maximum volume (1.0)', () => {
    const { container } = render(<VolumeIndicator volume={1.0} />)
    const bars = container.querySelectorAll('.w-1\\.5')
    
    // First 7 should be green
    for (let i = 0; i < 7; i++) {
      expect(bars[i]).toHaveClass('bg-green-500')
    }
    
    // 8th and 9th bars should be yellow
    expect(bars[7]).toHaveClass('bg-yellow-500')
    expect(bars[8]).toHaveClass('bg-yellow-500')
    
    // 10th bar should be red
    expect(bars[9]).toHaveClass('bg-red-500')
  })

  it('applies size classes correctly', () => {
    const { rerender, container } = render(<VolumeIndicator volume={0.5} size="sm" />)
    expect(container.firstChild).toHaveClass('h-12')
    
    rerender(<VolumeIndicator volume={0.5} size="md" />)
    expect(container.firstChild).toHaveClass('h-16')
    
    rerender(<VolumeIndicator volume={0.5} size="lg" />)
    expect(container.firstChild).toHaveClass('h-20')
  })

  it('applies custom className correctly', () => {
    const { container } = render(<VolumeIndicator volume={0.5} className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('sets correct ARIA attributes', () => {
    const { container } = render(<VolumeIndicator volume={0.75} />)
    const meter = container.firstChild
    expect(meter).toHaveAttribute('aria-valuenow', '75')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-label', 'Audio volume level')
  })
})
