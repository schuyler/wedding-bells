import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProgressIndicator } from '../ProgressIndicator'

describe('ProgressIndicator', () => {
  it('renders without crashing', () => {
    render(<ProgressIndicator currentState="welcome" />)
  })

  it('renders the correct number of steps', () => {
    const { container } = render(<ProgressIndicator currentState="welcome" states={['welcome', 'recording', 'upload']} />)
    const steps = container.querySelectorAll('.w-2\\.5')
    expect(steps.length).toBe(3)
  })

  it('displays the correct step counter', () => {
    const { container } = render(<ProgressIndicator currentState="upload" states={['welcome', 'recording', 'upload', 'thankyou']} />)
    
    // Find the step counter element by its class
    const stepCounter = container.querySelector('.text-xs.sm\\:text-sm.text-wedding-light\\/70');
    
    // Check the content - using textContent which combines all text nodes
    expect(stepCounter).not.toBeNull();
    expect(stepCounter?.textContent?.replace(/\s+/g, ' ').trim()).toBe('STEP 3 OF 4');
  })

  it('correctly customizes the steps displayed', () => {
    const { container } = render(<ProgressIndicator currentState="recording" states={['welcome', 'recording', 'upload']} />)
    const steps = container.querySelectorAll('.w-2\\.5')
    expect(steps.length).toBe(3)
  })
})
