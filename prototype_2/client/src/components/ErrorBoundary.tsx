import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-gray-950 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/50">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">Neural Core Crash</h1>
          <div className="bg-black/50 border border-red-900/30 p-6 rounded-2xl w-full max-w-lg mb-8">
            <p className="text-red-400 font-mono text-sm break-all">{this.state.errorMessage}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Re-Initialize System
          </button>
          <p className="mt-8 text-gray-600 text-[8px] uppercase tracking-widest">Error captured by BrainBricks BlackBox v1.0</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
