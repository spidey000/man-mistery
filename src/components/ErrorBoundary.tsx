import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ha ocurrido un error inesperado.";
      try {
        if (this.state.error?.message.includes('FirestoreErrorInfo')) {
           const parsed = JSON.parse(this.state.error.message);
           errorMessage = `Error de base de datos: ${parsed.error}`;
        } else {
           errorMessage = this.state.error?.message || errorMessage;
        }
      } catch (e) {
        // Ignore parse error
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">¡Ups! Algo salió mal</h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <button
            className="px-6 py-2 bg-red-600 text-white rounded-full font-bold shadow-md hover:bg-red-700 transition"
            onClick={() => window.location.reload()}
          >
            Volver a intentar
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
