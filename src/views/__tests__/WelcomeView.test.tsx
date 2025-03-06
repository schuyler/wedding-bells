import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeView } from '../WelcomeView';
import { useRecording } from '../../context/RecordingContext';
import { vi } from 'vitest';

// Mock the useRecording hook
vi.mock('../../context/RecordingContext', () => ({
  useRecording: vi.fn(),
}));

// Mock the WelcomeForm component
vi.mock('../../components/WelcomeForm', () => ({
  WelcomeForm: ({ onSubmit }: { onSubmit: (info: { name: string }) => void }) => (
    <div data-testid="welcome-form">
      <input 
        data-testid="name-input" 
        placeholder="Enter your name"
        onChange={(e) => {
          // Store the value for later use in the submit button
          (e.target as any).value = e.target.value;
        }}
      />
      <button 
        onClick={(e) => {
          const input = e.currentTarget.previousSibling as HTMLInputElement;
          onSubmit({ name: input.value || 'Test User' });
        }}
      >
        Submit
      </button>
    </div>
  ),
}));

describe('WelcomeView', () => {
  const mockSetGuestInfo = vi.fn();
  const mockGoToNextStep = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useRecording hook
    (useRecording as any).mockReturnValue({
      setGuestInfo: mockSetGuestInfo,
      goToNextStep: mockGoToNextStep,
    });
  });
  
  it('renders the welcome form', () => {
    render(<WelcomeView />);
    
    // Verify that the welcome form is rendered
    expect(screen.getByTestId('welcome-form')).toBeInTheDocument();
  });
  
  it('sets guest info and navigates on form submission', () => {
    render(<WelcomeView />);
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Verify that setGuestInfo was called with the expected data
    expect(mockSetGuestInfo).toHaveBeenCalledWith({ name: 'Test User' });
    
    // Verify that goToNextStep was called
    expect(mockGoToNextStep).toHaveBeenCalled();
  });
  
  it('handles form submission with custom name', () => {
    render(<WelcomeView />);
    
    // Enter a name
    const nameInput = screen.getByTestId('name-input');
    fireEvent.change(nameInput, { target: { value: 'Custom Name' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Submit'));
    
    // Verify that setGuestInfo was called with the custom name
    expect(mockSetGuestInfo).toHaveBeenCalledWith({ name: 'Custom Name' });
    
    // Verify that goToNextStep was called
    expect(mockGoToNextStep).toHaveBeenCalled();
  });
});
