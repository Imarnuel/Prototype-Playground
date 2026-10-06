import { Component, type ReactNode } from 'react';
import './ErrorBoundary.css';

/**
 * Last line of defence, not a designed state. The money rules throw on purpose —
 * `lineTotalMinor` rejects a fractional quantity, `productFor` rejects an unknown
 * product — and an uncaught throw during render unmounts the whole tree, so a demo
 * would go to a blank phone mid-presentation. This keeps the frame on screen and
 * offers a way back. Its copy is not from the design, which draws no error screen.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Render failed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="renderError" role="alert">
        <p className="renderError__title">Something went wrong</p>
        <p className="renderError__body">{this.state.error.message}</p>
        <button
          type="button"
          className="renderError__reset"
          onClick={() => { this.setState({ error: null }); this.props.onReset(); }}
        >
          Back to Sales Point
        </button>
      </div>
    );
  }
}
