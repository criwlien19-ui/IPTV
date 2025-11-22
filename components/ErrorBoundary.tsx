import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-500/30">
                <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Une erreur est survenue</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Désolé, l'application a rencontré un problème inattendu. Nous avons enregistré l'erreur.
            </p>
            
            <div className="space-y-3">
                <button
                onClick={() => window.location.reload()}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
                >
                <RefreshCw size={18} />
                Rafraîchir la page
                </button>
                
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-6 py-3 rounded-xl transition-all text-sm"
                >
                    Réinitialiser les données (En cas de bug persistant)
                </button>
            </div>

            {this.state.error && (
                <div className="mt-8 p-4 bg-black/40 rounded-lg text-left overflow-hidden border border-slate-800">
                    <p className="text-[10px] font-mono text-rose-400 break-words font-medium uppercase tracking-wider mb-1">Détails techniques</p>
                    <p className="text-xs font-mono text-slate-400 break-words">{this.state.error.toString()}</p>
                </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;