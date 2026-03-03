import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { translationKeyExists } from './translationUtils';

interface TranslationContextType {
  t: (key: string, options?: Record<string, any>) => string;
  changeLanguage: (lang: string) => Promise<void>;
  keyExists: (key: string) => boolean;
  dynamicTranslate: (basePath: string, subKey: string, options?: Record<string, any>) => string;
  ready: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n, ready } = useTranslation('translation', { useSuspense: false });
  
  const translate = (key: string, options?: Record<string, any>): string => {
    const translation = t(key, options);
    
    // If the translation is the same as the key, it might be missing
    if (translation === key && !translationKeyExists(key)) {
      console.warn(`Translation missing for key: ${key}`);
      return options?.defaultValue || key;
    }
    
    return translation;
  };
  
  const changeLanguage = async (lang: string): Promise<void> => {
    await i18n.changeLanguage(lang);
  };
  
  const dynamicTranslate = (
    basePath: string,
    subKey: string,
    options?: Record<string, any>
  ): string => {
    const fullKey = `${basePath}.${subKey}`;
    return translate(fullKey, options);
  };
  
  const value = {
    t: translate,
    changeLanguage,
    keyExists: translationKeyExists,
    dynamicTranslate,
    ready
  };
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};
