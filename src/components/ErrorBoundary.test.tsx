import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Mock child component that throws an error
const ThrowError = ({ message, shouldThrow }: { message: string; shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>Normal Render</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress expected console.error outputs from React when an error is thrown
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Render')).toBeInTheDocument();
  });

  it('renders standard error fallback when a generic error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Standard Test Error" shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Interrupted')).toBeInTheDocument();
    expect(screen.getByText('Standard Test Error')).toBeInTheDocument();
  });

  it('renders firestore specific fallback when a firestore error is thrown', () => {
    const firestoreErrorJson = JSON.stringify({
      error: "Missing or insufficient permissions.",
      operationType: "get"
    });

    render(
      <ErrorBoundary>
        <ThrowError message={firestoreErrorJson} shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Database Error: Missing or insufficient permissions.')).toBeInTheDocument();
    expect(screen.getByText('Check Firebase permissions and configuration')).toBeInTheDocument();
  });

  it('handles invalid json error messages gracefully', () => {
     render(
      <ErrorBoundary>
        <ThrowError message="{" shouldThrow />
      </ErrorBoundary>
    );

    // It should fall back to either the raw string message or the default "An unexpected error occurred."
    expect(screen.getByText('{')).toBeInTheDocument();
  });

  it('calls window.location.reload when reboot button is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadMock }
    });

    render(
      <ErrorBoundary>
        <ThrowError message="Standard Test Error" shouldThrow />
      </ErrorBoundary>
    );

    const rebootButton = screen.getByRole('button', { name: /Reboot System/i });
    fireEvent.click(rebootButton);

    expect(reloadMock).toHaveBeenCalled();
  });
});
