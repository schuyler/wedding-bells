import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
  })

  it('renders with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-6', 'h-6', 'border-2', 'border-blue-600')
  })

  it('renders with different sizes', async () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    const spinners1 = await screen.findAllByRole('progressbar');
    expect(spinners1[0]).toHaveClass('animate-spin', 'rounded-full', 'w-4', 'h-4', 'border-2', 'border-blue-600', 'border-t-transparent');

    rerender(<LoadingSpinner size="md" />);
    const spinners2 = await screen.findAllByRole('progressbar');
    expect(spinners2[0]).toHaveClass('animate-spin', 'rounded-full', 'w-6', 'h-6', 'border-2', 'border-blue-600', 'border-t-transparent');

    rerender(<LoadingSpinner size="lg" />);
    const spinners3 = await screen.findAllByRole('progressbar');
    expect(spinners3[0]).toHaveClass('animate-spin', 'rounded-full', 'w-8', 'h-8', 'border-3', 'border-blue-600', 'border-t-transparent');
  });

  it('renders with light prop', () => {
    render(<LoadingSpinner light />)
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toHaveClass('border-white')
  })

  it('renders with label', () => {
    render(<LoadingSpinner label="Loading..." />)
    const label = screen.getByText('Loading...')
    expect(label).toBeInTheDocument()
  })

  it('renders with fullScreen prop', async () => {
    render(<LoadingSpinner fullScreen label="Loading..." />)
    const spinner = await screen.findAllByRole('progressbar')
    expect(spinner[0]).toBeInTheDocument()
    const overlay = (await screen.findByText(/Loading.../i, {}, {timeout: 5000})).closest('div')
    expect(overlay?.parentElement).toHaveClass('fixed', 'inset-0', 'flex', 'items-center', 'justify-center')
  })

  it('sets correct ARIA attributes', () => {
    render(<LoadingSpinner label="Loading..." />)
    const spinner = screen.getByRole('progressbar')
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })
})
