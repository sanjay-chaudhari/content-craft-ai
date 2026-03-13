import React, { useState, useEffect } from 'react';
import VideoForm from './components/VideoForm';
import StatusPanel from './components/StatusPanel';
import JobsList from './components/JobsList';
import EmailSubscription from './components/EmailSubscription';
import Header from './components/Header';
import FeatureSelection, { FeatureType } from './components/FeatureSelection';
import AuthContainer from './auth/components/AuthContainer';
import { useAuth } from './auth/AuthContext';
import { Amplify } from 'aws-amplify';
import { awsConfig, getApiEndpoint, validateConfig } from './auth/config';

Amplify.configure(awsConfig);

const App: React.FC = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusCheck, setStatusCheck] = useState<boolean>(false);
  const [configError, setConfigError] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureType | null>(null);
  const apiEndpoint = getApiEndpoint();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    setConfigError(!validateConfig());
  }, []);

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 text-white p-6 rounded-xl max-w-md w-full">
          <h2 className="text-lg font-bold mb-3 text-red-400">Configuration Error</h2>
          <p className="text-slate-400 text-sm mb-3">Missing required environment variables:</p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">
            <li>VITE_AWS_REGION</li>
            <li>VITE_COGNITO_USER_POOL_ID</li>
            <li>VITE_COGNITO_USER_POOL_CLIENT_ID</li>
            <li>VITE_COGNITO_IDENTITY_POOL_ID</li>
            <li>VITE_API_ENDPOINT</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthContainer />;

  if (selectedFeature === null) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <FeatureSelection selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Back */}
        <button
          onClick={() => setSelectedFeature(null)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Main 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <VideoForm apiEndpoint={apiEndpoint} setJobId={setJobId} setStatusCheck={setStatusCheck} />
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <StatusPanel apiEndpoint={apiEndpoint} jobId={jobId} statusCheck={statusCheck} setStatusCheck={setStatusCheck} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <JobsList apiEndpoint={apiEndpoint} setJobId={setJobId} setStatusCheck={setStatusCheck} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t border-slate-800 mt-12 py-6">
    <div className="container mx-auto px-4 text-center text-slate-600 text-xs">
      ContentCraft AI · Powered by Amazon Nova
    </div>
  </footer>
);

export default App;
