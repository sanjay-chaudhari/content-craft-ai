import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslationHelper } from '../utils/useTranslationHelper';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

interface AutomatedMultiClipFormProps {
  apiEndpoint: string;
  setJobId: (jobId: string | null) => void;
  setStatusCheck: (check: boolean) => void;
}

const AutomatedMultiClipForm: React.FC<AutomatedMultiClipFormProps> = ({ 
  apiEndpoint, 
  setJobId, 
  setStatusCheck 
}) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { t } = useTranslationHelper();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError(t('FORM.ERRORS.REQUIRED'));
      return;
    }
    
    if (prompt.length < 20) {
      setError(t('FORM.ERRORS.MIN_LENGTH', { length: 20 }));
      return;
    }
    
    if (duration < 12 || duration > 120) {
      setError(t('FORM.ERRORS.DURATION_RANGE'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get the current authentication token
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }
      
      // Prepare request payload
      const payload = {
        task_type: 'MULTI_SHOT_AUTOMATED',
        prompt: prompt,
        duration: duration
      };
      
      // Submit job request
      const response = await axios.post(`${apiEndpoint}/reel_generation`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken
        }
      });
      
      // Handle successful response
      if (response.data && response.data.job_id) {
        setJobId(response.data.job_id);
        setStatusCheck(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error submitting job:', error);
      setError('Failed to submit job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-aws-orange mb-2">
          {t('FORM.AUTOMATED_MULTI_CLIP.TITLE')}
        </h3>
        <p className="text-aws-gray-300 text-sm mb-4">
          {t('FORM.AUTOMATED_MULTI_CLIP.DESCRIPTION')}
        </p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-aws-gray-300 mb-2">
          {t('FORM.PROMPT.LABEL')}
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('FORM.PROMPT.PLACEHOLDER')}
          className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 min-h-[150px]"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-aws-gray-400">
          {t('FORM.PROMPT.HELPER')}
        </p>
      </div>
      
      <div className="mb-6">
        <label htmlFor="duration" className="block text-sm font-medium text-aws-gray-300 mb-2">
          {t('FORM.DURATION.LABEL')}
        </label>
        <div className="flex items-center">
          <input
            type="range"
            id="duration"
            min="12"
            max="120"
            step="6"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full mr-4"
            disabled={isSubmitting}
          />
          <span className="text-aws-gray-300 w-12 text-center">{duration}s</span>
        </div>
        <p className="mt-1 text-xs text-aws-gray-400">
          {t('FORM.DURATION.HELPER')}
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-aws-red bg-opacity-20 border border-aws-red rounded text-aws-red text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded ${
            isSubmitting
              ? 'bg-aws-blue-light text-aws-gray-400 cursor-not-allowed'
              : 'bg-aws-orange hover:bg-aws-orange-light text-white'
          }`}
        >
          {isSubmitting ? t('FORM.SUBMITTING') : t('FORM.SUBMIT')}
        </button>
      </div>
    </form>
  );
};

export default AutomatedMultiClipForm;
