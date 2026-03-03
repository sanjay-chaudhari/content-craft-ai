import React, { useState } from 'react';
import SingleClipForm from './SingleClipForm';
import AutomatedMultiClipForm from './AutomatedMultiClipForm';
import ManualMultiClipForm from './ManualMultiClipForm';
import DirectorAgent from './DirectorAgent';
import { useTranslationHelper } from '../utils/useTranslationHelper';

enum VideoType {
  DIRECTOR = 'director',
  SINGLE_CLIP = 'single',
  AUTOMATED_MULTI_CLIP = 'automated',
  MANUAL_MULTI_CLIP = 'manual'
}

interface VideoFormProps {
  apiEndpoint: string;
  setJobId: (jobId: string | null) => void;
  setStatusCheck: (check: boolean) => void;
}

const VideoForm: React.FC<VideoFormProps> = ({ apiEndpoint, setJobId, setStatusCheck }) => {
  const [videoType, setVideoType] = useState<VideoType>(VideoType.DIRECTOR);
  const [directorShots, setDirectorShots] = useState<{ text: string }[] | null>(null);
  const { t } = useTranslationHelper();

  // When director agent produces a plan, switch to manual form pre-filled with shots
  const handlePlanAccepted = (shots: { text: string }[]) => {
    setDirectorShots(shots);
    setVideoType(VideoType.MANUAL_MULTI_CLIP);
  };

  const renderForm = () => {
    switch (videoType) {
      case VideoType.DIRECTOR:
        return (
          <DirectorAgent
            apiEndpoint={apiEndpoint}
            onPlanAccepted={handlePlanAccepted}
          />
        );
      case VideoType.SINGLE_CLIP:
        return (
          <SingleClipForm
            apiEndpoint={apiEndpoint}
            setJobId={setJobId}
            setStatusCheck={setStatusCheck}
          />
        );
      case VideoType.AUTOMATED_MULTI_CLIP:
        return (
          <AutomatedMultiClipForm
            apiEndpoint={apiEndpoint}
            setJobId={setJobId}
            setStatusCheck={setStatusCheck}
          />
        );
      case VideoType.MANUAL_MULTI_CLIP:
        return (
          <ManualMultiClipForm
            apiEndpoint={apiEndpoint}
            setJobId={setJobId}
            setStatusCheck={setStatusCheck}
            initialShots={directorShots || undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="videoType" className="block text-sm font-medium text-aws-gray-300 mb-2">
          {t('FORM.VIDEO_TYPE.LABEL')}
        </label>
        <select
          id="videoType"
          value={videoType}
          onChange={(e) => {
            setVideoType(e.target.value as VideoType);
            setDirectorShots(null);
          }}
          className="w-full p-2 bg-aws-blue-light border border-aws-gray-600 rounded text-aws-gray-100"
        >
          <option value={VideoType.DIRECTOR}>✨ AI Director (Nova Agent)</option>
          <option value={VideoType.SINGLE_CLIP}>{t('FORM.VIDEO_TYPE.SINGLE_CLIP')}</option>
          <option value={VideoType.AUTOMATED_MULTI_CLIP}>{t('FORM.VIDEO_TYPE.AUTOMATED_MULTI_CLIP')}</option>
          <option value={VideoType.MANUAL_MULTI_CLIP}>{t('FORM.VIDEO_TYPE.MANUAL_MULTI_CLIP')}</option>
        </select>
      </div>

      {renderForm()}
    </div>
  );
};

export default VideoForm;
