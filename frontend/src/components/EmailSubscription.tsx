import React, { useState } from 'react';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from '../auth/AuthContext';

interface EmailSubscriptionProps {
  apiEndpoint: string;
}

const EmailSubscription: React.FC<EmailSubscriptionProps> = ({ apiEndpoint }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const email = user?.attributes?.email;

  const call = async (action: 'subscribe' | 'unsubscribe') => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      if (!idToken) throw new Error('No auth token');
      await axios.post(`${apiEndpoint}/subscribe`, { action }, {
        headers: { Authorization: idToken, 'Content-Type': 'application/json' }
      });
      setMessage({
        text: action === 'subscribe' ? 'Subscribed! Check your email to confirm.' : 'Unsubscribed successfully.',
        type: 'success'
      });
    } catch {
      setMessage({ text: `Failed to ${action}. Please try again.`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-white mb-1">Email Notifications</h3>
      <p className="text-slate-400 text-xs mb-4">Get notified when your video is ready.</p>

      {email && (
        <p className="text-xs text-slate-500 mb-4 truncate">
          <span className="text-slate-400">{email}</span>
        </p>
      )}

      {message && (
        <div className={`text-xs p-2.5 rounded-lg mb-4 border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={() => call('subscribe')}
          disabled={isLoading}
          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold transition-colors disabled:opacity-40"
        >
          {isLoading ? 'Please wait…' : 'Subscribe'}
        </button>
        <button
          onClick={() => call('unsubscribe')}
          disabled={isLoading}
          className="w-full py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-40"
        >
          Unsubscribe
        </button>
      </div>
    </div>
  );
};

export default EmailSubscription;
