import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    render(<ProgressBar progress={50} />)
  })

  it('renders with the correct progress value', () => {
    render(<ProgressBar progress={75} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<ProgressBar progress={50} size="sm" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('h-1')

    rerender(<ProgressBar progress={50} size="md" />)
    expect(progressBar).toHaveClass('h-2')

    rerender(<ProgressBar progress={50} size="lg" />)
    expect(progressBar).toHaveClass('h-3')
  })

  it('renders with and without the label', () => {
    const { rerender } = render(<ProgressBar progress={50} showLabel />)
    expect(screen.getByText('50%')).toBeInTheDocument()

    rerender(<ProgressBar progress={50} showLabel={false} />)
    expect(() => screen.getByText('50%')).toThrowError()
  })

  it('renders with different variants', () => {
    const { rerender } = render(<ProgressBar progress={50} variant="primary" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('bg-blue-500')

    rerender(<ProgressBar progress={50} variant="success" />)
    expect(progressBar).toHaveClass('bg-green-500')

    rerender(<ProgressBar progress={50} variant="warning" />)
    expect(progressBar).toHaveClass('bg-yellow-500')
  })

  it('renders with a custom className', () => {
    render(<ProgressBar progress={50} className="custom-class" />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveClass('custom-class')
  })

  it('clamps the progress value between 0 and 100', () => {
    let progressBars;
    render(
      <>
        <ProgressBar progress={-10} />
        <ProgressBar progress={110} />
      </>
    )
    progressBars = screen.getAllByRole('progressbar')
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '0')
    expect(progressBars[1]).toHaveAttribute('aria-valuenow', '100')
  })
})
