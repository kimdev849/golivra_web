import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-surface-muted flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="text-4xl mb-4">😵</div>
            <h1 className="text-lg font-bold text-txt mb-2">Quelque chose s'est mal passé</h1>
            <p className="text-sm text-txt-muted mb-4">{this.state.error.message}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
