import React, { Component, ErrorInfo, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    const { t } = this.props;
    
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-6 bg-aws-red bg-opacity-20 border border-aws-red rounded-md">
          <h2 className="text-xl font-bold text-aws-red mb-2">
            {t('ERROR_BOUNDARY.TITLE', 'Something went wrong')}
          </h2>
          <p className="mb-4 text-aws-gray-200">
            {t('ERROR_BOUNDARY.MESSAGE', 'The application encountered an unexpected error.')}
          </p>
          <details className="bg-aws-blue-dark p-3 rounded">
            <summary className="cursor-pointer text-aws-gray-300 font-medium">
              {t('ERROR_BOUNDARY.DETAILS', 'Error details')}
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-aws-gray-400 text-sm overflow-auto max-h-96">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            className="mt-4 bg-aws-blue-medium hover:bg-aws-blue-light text-white py-2 px-4 rounded transition-colors"
            onClick={() => window.location.reload()}
          >
            {t('ERROR_BOUNDARY.RELOAD', 'Reload Application')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
