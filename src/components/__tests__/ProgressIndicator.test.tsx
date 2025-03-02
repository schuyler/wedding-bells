import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressIndicator } from '../ProgressIndicator'

describe('ProgressIndicator', () => {
  it('renders without crashing', () => {
    render(<ProgressIndicator currentState="welcome" />)
  })

 it('renders the correct number of steps', () => {
    const { container } = render(<ProgressIndicator currentState="welcome" states={['welcome', 'recording', 'preview']} />)
    const steps = container.querySelectorAll('.w-2\\.5')
    expect(steps.length).toBe(3)
  })

  it('highlights the current step', () => {
    render(<ProgressIndicator currentState="recording" states={['welcome', 'recording', 'preview']} />)
    const currentStep = screen.getByText('recording')
    expect(currentStep).toBeInTheDocument()
  })

  it('displays the correct step counter', () => {
    render(<ProgressIndicator currentState="preview" states={['welcome', 'recording', 'preview', 'upload', 'thankyou']} />)
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument()
  })

  it('displays the correct step label', () => {
    render(<ProgressIndicator currentState="welcome" />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()

    render(<ProgressIndicator currentState="recording" />)
    expect(screen.getByText('recording')).toBeInTheDocument()
  })

  it('correctly customizes the steps displayed', () => {
    render(<ProgressIndicator currentState="recording" states={['welcome', 'recording', 'preview']} />)
    const step1 = screen.getByText('recording')
    expect(step1).toBeInTheDocument()
  })
})
