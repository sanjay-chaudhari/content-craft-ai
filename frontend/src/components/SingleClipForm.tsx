import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslationHelper } from '../utils/useTranslationHelper';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { processImageForSubmission } from '../utils/imageUtils';

interface SingleClipFormProps {
  apiEndpoint: string;
  setJobId: (jobId: string | null) => void;
  setStatusCheck: (check: boolean) => void;
}

const SingleClipForm: React.FC<SingleClipFormProps> = ({ 
  apiEndpoint, 
  setJobId, 
  setStatusCheck 
}) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { t } = useTranslationHelper();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t('FORM.ERRORS.IMAGE_SIZE'));
        return;
      }
      
      // Check file type
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        setError(t('FORM.ERRORS.IMAGE_FORMAT'));
        return;
      }
      
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError(t('FORM.ERRORS.REQUIRED'));
      return;
    }
    
    if (prompt.length < 10) {
      setError(t('FORM.ERRORS.MIN_LENGTH', { length: 10 }));
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
      const payload: any = {
        task_type: 'TEXT_VIDEO',
        prompt: prompt
      };
      
      // Process image if provided
      if (image) {
        const base64Image = await processImageForSubmission(image);
        payload.image = base64Image;
      }
      
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
          {t('FORM.SINGLE_CLIP.TITLE')}
        </h3>
        <p className="text-aws-gray-300 text-sm mb-4">
          {t('FORM.SINGLE_CLIP.DESCRIPTION')}
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
          className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 min-h-[120px]"
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-aws-gray-400">
          {t('FORM.PROMPT.HELPER')}
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-aws-gray-300 mb-2">
          {t('FORM.IMAGE.LABEL')}
        </label>
        
        {!imagePreview ? (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-aws-gray-600 rounded">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-aws-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-aws-gray-400">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-aws-blue-dark rounded px-3 py-2 font-medium text-aws-orange hover:text-aws-orange-light focus-within:outline-none"
                >
                  <span>{t('FORM.IMAGE.UPLOAD')}</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
              <p className="text-xs text-aws-gray-400">
                {t('FORM.IMAGE.HELPER')}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-1 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 rounded border border-aws-gray-600"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-aws-blue-dark bg-opacity-75 text-aws-red p-1 rounded-full hover:bg-opacity-100"
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
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

export default SingleClipForm;
