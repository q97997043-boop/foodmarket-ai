import React from "react";

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Send to logging service if available
    try {
      // eslint-disable-next-line no-console
      console.error("Unhandled render error:", error, info);
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
          <div className="text-6xl">💥</div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-slate-400">An unexpected error occurred. Please reload.</p>
        </div>
      );
    }

    return this.props.children as any;
  }
}

export default ErrorBoundary;
