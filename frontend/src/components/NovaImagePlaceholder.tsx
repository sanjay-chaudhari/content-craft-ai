import React from 'react';
import { useTranslationHelper } from '../utils/useTranslationHelper';

interface NovaImagePlaceholderProps {
  apiEndpoint: string;
}

const NovaImagePlaceholder: React.FC<NovaImagePlaceholderProps> = ({ apiEndpoint }) => {
  const { t } = useTranslationHelper();

  return (
    <div className="bg-aws-blue-medium p-6 rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-aws-orange">
        {t('NOVA_IMAGE.TITLE')}
      </h2>
      
      <div className="bg-aws-blue-dark p-8 rounded-lg text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-aws-orange mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        <h3 className="text-xl font-bold text-aws-orange mb-4">
          {t('NOVA_IMAGE.COMING_SOON')}
        </h3>
        
        <p className="text-aws-gray-300 mb-6">
          {t('NOVA_IMAGE.DESCRIPTION')}
        </p>
        
        <div className="bg-aws-blue-medium p-4 rounded-lg mb-6">
          <h4 className="text-lg font-semibold text-aws-orange-light mb-2">
            {t('NOVA_IMAGE.PLANNED_FEATURES')}
          </h4>
          <ul className="text-left text-aws-gray-300 list-disc pl-6 space-y-2">
            <li>{t('NOVA_IMAGE.FEATURE_1')}</li>
            <li>{t('NOVA_IMAGE.FEATURE_2')}</li>
            <li>{t('NOVA_IMAGE.FEATURE_3')}</li>
            <li>{t('NOVA_IMAGE.FEATURE_4')}</li>
            <li>{t('NOVA_IMAGE.FEATURE_5')}</li>
          </ul>
        </div>
        
        <button 
          className="bg-aws-blue-light text-aws-gray-300 border border-aws-gray-600 px-6 py-3 rounded-md opacity-50 cursor-not-allowed"
          disabled
        >
          {t('NOVA_IMAGE.NOTIFY_ME')}
        </button>
      </div>
    </div>
  );
};

export default NovaImagePlaceholder;
