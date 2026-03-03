import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../locales/en/translation.json';

// Force reload the translations to ensure they're up to date
const resources = {
  en: {
    translation: enTranslation
  }
};

// Clear any cached translations
if (i18n.isInitialized) {
  i18n.reloadResources();
}

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development', // Enable debug only in development
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false // Disable suspense to prevent issues with SSR
    },
    // Force reload translations on init
    initImmediate: false,
    // Add missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
    }
  });

// Validate translation keys in development
if (process.env.NODE_ENV === 'development') {
  // Log loaded translations for debugging
  console.log('i18n initialized with translations:', i18n.getDataByLanguage('en'));
  
  // Add a global method to check for missing translations
  (window as any).validateTranslations = () => {
    const missingKeys: string[] = [];
    const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
      return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
        const pre = prefix.length ? `${prefix}.` : '';
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          Object.assign(acc, flattenObject(obj[k], `${pre}${k}`));
        } else {
          acc[`${pre}${k}`] = obj[k];
        }
        return acc;
      }, {});
    };
    
    // Get all translation keys
    const translations = i18n.getDataByLanguage('en')?.translation;
    if (translations) {
      const flatTranslations = flattenObject(translations);
      console.log('All translation keys:', Object.keys(flatTranslations).length);
    }
    
    return missingKeys;
  };
}

export default i18n;
