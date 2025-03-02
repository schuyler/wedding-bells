import { render, screen } from '@testing-library/react';
import { ThankYouView } from '../ThankYouView';
import { useRecording } from '../../context/RecordingContext';
import { vi } from 'vitest';

// Mock the useRecording hook
vi.mock('../../context/RecordingContext', () => ({
  useRecording: vi.fn(),
}));

// Mock the ThankYou component
vi.mock('../../components/ThankYou', () => ({
  ThankYou: ({ guestName, onRecordAnother }: { guestName: string, onRecordAnother: () => void }) => (
    <div data-testid="thank-you">
      <div data-testid="guest-name">{guestName}</div>
      <button onClick={onRecordAnother}>Record Another</button>
    </div>
  ),
}));

describe('ThankYouView', () => {
  const mockResetFlow = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('displays guest name when available', () => {
    // Mock the useRecording hook with guest info
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User', email: 'test@example.com' },
      resetFlow: mockResetFlow,
    });
    
    render(<ThankYouView />);
    
    // Verify that the guest name is displayed
    expect(screen.getByTestId('guest-name').textContent).toBe('Test User');
  });
  
  it('handles missing guest name gracefully', () => {
    // Mock the useRecording hook without guest info
    (useRecording as any).mockReturnValue({
      guestInfo: null,
      resetFlow: mockResetFlow,
    });
    
    render(<ThankYouView />);
    
    // Verify that an empty string is used when guest name is missing
    expect(screen.getByTestId('guest-name').textContent).toBe('');
  });
  
  it('resets flow when "Record Another" is clicked', () => {
    // Mock the useRecording hook
    (useRecording as any).mockReturnValue({
      guestInfo: { name: 'Test User', email: 'test@example.com' },
      resetFlow: mockResetFlow,
    });
    
    render(<ThankYouView />);
    
    // Click the "Record Another" button
    screen.getByText('Record Another').click();
    
    // Verify that resetFlow was called
    expect(mockResetFlow).toHaveBeenCalled();
  });
});
