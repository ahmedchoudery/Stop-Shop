/**
 * @fileoverview Error Boundary components
 * Applies: react-patterns (error boundaries at every level), react-ui-patterns (always surface errors)
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// CLASS-BASED ERROR BOUNDARY (required by React API)
// ─────────────────────────────────────────────────────────────────

/**
 * Catches render-time errors in the component tree.
 * Shows a fallback UI and logs the error.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to error tracking service (Sentry, etc.)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      return (
        <ErrorState
          error={this.state.error}
          onRetry={this.handleReset}
          title={this.props.title ?? 'Something went wrong'}
          minimal={this.props.minimal}
        />
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────
// ERROR STATE UI COMPONENT
// ─────────────────────────────────────────────────────────────────

/**
 * Presentational error state — shown after catching an error.
 *
 * @param {{ error: Error|null, onRetry?: function, title?: string, minimal?: boolean }} props
 */
export const ErrorState = ({ error, onRetry, title = 'Something went wrong', minimal = false }) => {
  if (minimal) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
        <AlertTriangle size={16} />
        <p className="text-xs font-bold">{error?.message ?? title}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-xs font-black uppercase tracking-widest underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-10 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="text-red-600" size={28} />
      </div>
      <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 mb-2">
        {title}
      </h3>
      {error?.message && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">{error.message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-6 py-3 bg-[#ba1f3d] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ASYNC STATE UI — loading / error / empty / data
// ─────────────────────────────────────────────────────────────────

/**
 * Unified async content renderer following React UI Patterns golden rules.
 *
 * Rules applied:
 * - Show loading ONLY when there is no data (loading && !data)
 * - Always surface errors with a retry button
 * - Always provide empty states
 *
 * @param {{ loading: boolean, error: string|null, data: any, children: React.ReactNode,
 *           empty?: React.ReactNode, skeleton?: React.ReactNode, onRetry?: function }} props
 */
export const AsyncContent = ({
  loading,
  error,
  data,
  children,
  empty,
  skeleton,
  onRetry,
}) => {
  // 1. Error always surfaced first
  if (error) {
    return (
      <ErrorState
        error={{ message: error }}
        onRetry={onRetry}
        title="Failed to load"
        minimal
      />
    );
  }

  // 2. Loading ONLY when no data exists (prevents flash on refetch)
  if (loading && !data) {
    return skeleton ?? <LoadingSkeleton />;
  }

  // 3. Empty state when data is an empty array
  if (Array.isArray(data) && data.length === 0) {
    return empty ?? <DefaultEmpty />;
  }

  // 4. Render data
  return children;
};

// ─────────────────────────────────────────────────────────────────
// DEFAULT FALLBACK COMPONENTS
// ─────────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="space-y-3 p-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
    ))}
  </div>
);

const DefaultEmpty = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-10 border-2 border-dashed border-gray-100 rounded-xl text-center">
    <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-300">No data yet</p>
  </div>
);

export default ErrorBoundary;