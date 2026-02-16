import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders online status', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders offline status', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('defaults to unknown when no status provided', () => {
    render(<StatusBadge />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('applies correct color classes for online', () => {
    const { container } = render(<StatusBadge status="online" />);
    expect(container.firstChild).toHaveClass('text-green-400');
  });

  it('applies correct color classes for error', () => {
    const { container } = render(<StatusBadge status="error" />);
    expect(container.firstChild).toHaveClass('text-amber-400');
  });
});
