import { useTranslation } from 'react-i18next';

/**
 * Custom hook that wraps react-i18next's useTranslation hook to provide
 * consistent translation behavior across the application.
 * 
 * @returns Enhanced translation utilities
 */
export const useTranslationHelper = () => {
  const { t, i18n, ready } = useTranslation('translation', { useSuspense: false });
  
  /**
   * Translates a key with fallback to the key itself if translation is missing
   * 
   * @param key The translation key
   * @param options Optional parameters for the translation
   * @returns The translated string or the key if translation is missing
   */
  const translate = (key: string, options?: Record<string, any>): string => {
    const translation = t(key, options);
    
    // If the translation is the same as the key, it might be missing
    // But we need to handle cases where the translation is intentionally the same as the key
    if (translation === key && !keyExists(key)) {
      console.warn(`Translation missing for key: ${key}`);
      return options?.defaultValue || key;
    }
    
    return translation;
  };
  
  /**
   * Checks if a translation key exists in the current language
   * 
   * @param key The translation key to check
   * @returns True if the key exists, false otherwise
   */
  const keyExists = (key: string): boolean => {
    const data = i18n.getDataByLanguage(i18n.language);
    if (!data || !data.translation) return false;
    
    // Handle nested keys (e.g., "APP.HEADER.TITLE")
    const keyParts = key.split('.');
    let current: any = data.translation;
    
    for (const part of keyParts) {
      if (current[part] === undefined) return false;
      current = current[part];
    }
    
    return true;
  };
  
  /**
   * Builds a dynamic translation key and returns its translation
   * 
   * @param basePath The base path for the translation key
   * @param subKey The sub-key to append to the base path
   * @param options Optional parameters for the translation
   * @returns The translated string
   */
  const dynamicTranslate = (
    basePath: string,
    subKey: string,
    options?: Record<string, any>
  ): string => {
    const fullKey = `${basePath}.${subKey}`;
    return translate(fullKey, options);
  };
  
  return {
    t: translate,
    i18n,
    keyExists,
    dynamicTranslate,
    ready
  };
};
