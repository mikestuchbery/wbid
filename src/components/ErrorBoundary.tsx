import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 text-center">
          <div className="glass max-w-md w-full p-10 rounded-[40px] space-y-6 border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="serif text-3xl glow-text">System <span className="italic text-red-500">Interrupted</span></h2>
              <p className="text-sm text-brand-text/60 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-brand-accent text-brand-bg rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Reboot System
            </button>
            {isFirestoreError && (
              <p className="text-[10px] font-mono opacity-30 uppercase tracking-tighter">
                Check Firebase permissions and configuration
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
