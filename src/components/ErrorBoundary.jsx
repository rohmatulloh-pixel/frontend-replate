import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage?.clear();
        window.localStorage?.clear();
      }
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-sky-100 shadow-card text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
              ⚠️
            </div>
            <div>
              <h2 className="text-2xl font-display font-extrabold text-brand-900">
                Oops, Something went wrong!
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-2">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 rounded-full font-display font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white shadow-pill transition-all"
              >
                Reload Page 🔄
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-full font-display font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Reset Local Data & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
