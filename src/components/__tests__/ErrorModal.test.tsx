import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ErrorModal } from '../ErrorModal'

describe('ErrorModal', () => {
  it('renders with required props', async () => {
    await act(async () => {
      render(
        <ErrorModal
          isOpen={true}
          onClose={() => {}}
          title="Test Title"
          description="Test Description"
        />
      );
    });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('shows/hides based on isOpen prop', async () => {
    const { container, rerender } = render(
      <ErrorModal
        isOpen={false}
        onClose={() => {}}
        title="Test Title"
        description="Test Description"
      />
    )
    expect(container.firstChild).toBeNull()

    await act(async () => {
      rerender(
        <ErrorModal
          isOpen={true}
          onClose={() => {}}
          title="Test Title"
          description="Test Description"
        />
      )
    })
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders action button when action prop is provided', async () => {
    await act(async () => {
      render(
        <ErrorModal
          isOpen={true}
          onClose={() => {}}
          title="Test Title"
          description="Test Description"
          action={{ label: 'Retry', onClick: () => {} }}
        />
      );
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders children content when provided', async () => {
    await act(async () => {
      render(
        <ErrorModal
          isOpen={true}
          onClose={() => {}}
          title="Test Title"
          description="Test Description"
        >
          <div>Additional Content</div>
        </ErrorModal>
      );
    });
    expect(screen.getByText('Additional Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        title="Test Title"
        description="Test Description"
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Close'))
    })
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls action.onClick when action button is clicked', async () => {
    const onClick = vi.fn()
    render(
      <ErrorModal
        isOpen={true}
        onClose={() => {}}
        title="Test Title"
        description="Test Description"
        action={{ label: 'Retry', onClick: onClick }}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Retry'))
    })
    expect(onClick).toHaveBeenCalledTimes(1);
  });
})
