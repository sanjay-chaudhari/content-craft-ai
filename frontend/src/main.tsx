import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './auth/AuthContext';
import { TranslationProvider } from './utils/TranslationContext';

// Import i18n configuration before any components
// Force a clean import by using a timestamp to avoid caching
import './i18n';  // Simplified import to avoid syntax error

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TranslationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </TranslationProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
