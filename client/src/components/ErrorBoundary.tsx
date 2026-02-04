import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * Catches uncaught JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console (could also send to error reporting service)
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
                        <p className="text-gray-400 mb-6">
                            Don't worry, it's not you. The app encountered an unexpected error.
                        </p>

                        {/* Error Details (collapsible in production) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <Bug className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-mono text-red-400">Developer Info</span>
                                </div>
                                <p className="text-xs font-mono text-red-300 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-neon text-black font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                <RefreshCcw className="w-5 h-5" />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go Home
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 mt-6">
                            If this keeps happening, try clearing your browser cache or contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
