import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTranslationHelper } from '../utils/useTranslationHelper';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import { processImageForSubmission } from '../utils/imageUtils';

interface Shot {
  text: string;
  image?: string | null;
  imageFile?: File | null;
  imagePreview?: string | null;
}

interface ManualMultiClipFormProps {
  apiEndpoint: string;
  setJobId: (jobId: string | null) => void;
  setStatusCheck: (check: boolean) => void;
  initialShots?: { text: string }[];
}

const ManualMultiClipForm: React.FC<ManualMultiClipFormProps> = ({ 
  apiEndpoint, 
  setJobId, 
  setStatusCheck,
  initialShots
}) => {
  const defaultShots = initialShots && initialShots.length >= 2
    ? initialShots.map(s => ({ text: s.text, image: null, imageFile: null, imagePreview: null }))
    : [
        { text: '', image: null, imageFile: null, imagePreview: null },
        { text: '', image: null, imageFile: null, imagePreview: null }
      ];

  const [shotCount, setShotCount] = useState(defaultShots.length);
  const [shots, setShots] = useState<Shot[]>(defaultShots);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const { t } = useTranslationHelper();

  const handleShotCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    setShotCount(newCount);
    
    // Adjust shots array
    if (newCount > shots.length) {
      // Add new shots
      const newShots = [...shots];
      for (let i = shots.length; i < newCount; i++) {
        newShots.push({ text: '', image: null, imageFile: null, imagePreview: null });
      }
      setShots(newShots);
    } else if (newCount < shots.length) {
      // Remove excess shots
      const newShots = shots.slice(0, newCount);
      setShots(newShots);
    }
  };

  const handleShotTextChange = (index: number, text: string) => {
    const newShots = [...shots];
    newShots[index].text = text;
    setShots(newShots);
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const newShots = [...shots];
      newShots[index].imageFile = selectedFile;
      newShots[index].imagePreview = URL.createObjectURL(selectedFile);
      setShots(newShots);
      setError(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newShots = [...shots];
    if (newShots[index].imagePreview) {
      URL.revokeObjectURL(newShots[index].imagePreview!);
    }
    newShots[index].imageFile = null;
    newShots[index].imagePreview = null;
    newShots[index].image = null;
    setShots(newShots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all shots have text
    for (let i = 0; i < shots.length; i++) {
      if (!shots[i].text.trim()) {
        setError(t('FORM.ERRORS.SHOT_TEXT_REQUIRED', { number: i + 1 }));
        return;
      }
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
      
      // Process images for shots that have them
      const processedShots = await Promise.all(
        shots.map(async (shot) => {
          const processedShot: any = { text: shot.text };
          
          if (shot.imageFile) {
            processedShot.image = await processImageForSubmission(shot.imageFile);
          }
          
          return processedShot;
        })
      );
      
      // Prepare request payload
      const payload = {
        task_type: 'MULTI_SHOT_MANUAL',
        shots: processedShots
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
          {t('FORM.MANUAL_MULTI_CLIP.TITLE')}
        </h3>
        <p className="text-aws-gray-300 text-sm mb-4">
          {t('FORM.MANUAL_MULTI_CLIP.DESCRIPTION')}
        </p>
      </div>
      
      <div className="mb-6">
        <label htmlFor="shotCount" className="block text-sm font-medium text-aws-gray-300 mb-2">
          {t('FORM.SHOTS.LABEL')}
        </label>
        <div className="flex items-center">
          <input
            type="range"
            id="shotCount"
            min="2"
            max="20"
            value={shotCount}
            onChange={handleShotCountChange}
            className="w-full mr-4"
            disabled={isSubmitting}
          />
          <span className="text-aws-gray-300 w-12 text-center">{shotCount}</span>
        </div>
        <p className="mt-1 text-xs text-aws-gray-400">
          {t('FORM.SHOTS.HELPER')}
        </p>
      </div>
      
      <div className="space-y-6">
        {shots.map((shot, index) => (
          <div key={index} className="p-4 bg-aws-blue-dark rounded">
            <h4 className="text-md font-medium text-aws-orange mb-3">
              {t('FORM.SHOT.TITLE', { number: index + 1 })}
            </h4>
            
            <div className="mb-4">
              <label htmlFor={`shot-${index}-text`} className="block text-sm font-medium text-aws-gray-300 mb-2">
                {t('FORM.SHOT.PROMPT.LABEL')}
              </label>
              <textarea
                id={`shot-${index}-text`}
                value={shot.text}
                onChange={(e) => handleShotTextChange(index, e.target.value)}
                placeholder={t('FORM.SHOT.PROMPT.PLACEHOLDER')}
                className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100 min-h-[80px]"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-aws-gray-300 mb-2">
                {t('FORM.IMAGE.LABEL')}
              </label>
              
              {!shot.imagePreview ? (
                <div className="mt-1 flex justify-center px-4 py-3 border-2 border-dashed border-aws-gray-600 rounded">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-aws-gray-400"
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
                    <div className="flex text-sm text-aws-gray-400 justify-center">
                      <label
                        htmlFor={`image-upload-${index}`}
                        className="relative cursor-pointer bg-aws-blue rounded px-2 py-1 text-xs font-medium text-aws-orange hover:text-aws-orange-light focus-within:outline-none"
                      >
                        <span>{t('FORM.IMAGE.UPLOAD')}</span>
                        <input
                          id={`image-upload-${index}`}
                          name={`image-upload-${index}`}
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png"
                          onChange={(e) => handleImageChange(index, e)}
                          disabled={isSubmitting}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 relative">
                  <img
                    src={shot.imagePreview}
                    alt={`Shot ${index + 1} preview`}
                    className="max-h-32 rounded border border-aws-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-aws-blue-dark bg-opacity-75 text-aws-red p-1 rounded-full hover:bg-opacity-100"
                    disabled={isSubmitting}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="mt-6 mb-4 p-2 bg-aws-red bg-opacity-20 border border-aws-red rounded text-aws-red text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-end mt-6">
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

export default ManualMultiClipForm;
