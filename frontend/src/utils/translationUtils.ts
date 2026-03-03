import i18n from '../i18n';

/**
 * Validates if a translation key exists in the current language
 * 
 * @param key The translation key to check
 * @returns True if the key exists, false otherwise
 */
export const translationKeyExists = (key: string): boolean => {
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
 * Finds all missing translation keys in a component
 * Useful for development and testing
 * 
 * @param componentTranslationKeys Array of translation keys used in a component
 * @returns Array of missing translation keys
 */
export const findMissingTranslations = (componentTranslationKeys: string[]): string[] => {
  return componentTranslationKeys.filter(key => !translationKeyExists(key));
};

/**
 * Ensures consistent translation key format
 * 
 * @param section The section of the application (e.g., "FORM", "APP")
 * @param component The component name (e.g., "HEADER", "SUBMIT")
 * @param key The specific key within the component
 * @returns Properly formatted translation key
 */
export const formatTranslationKey = (section: string, component: string, key: string): string => {
  return `${section}.${component}.${key}`;
};

/**
 * Extracts the base path from a translation key
 * Useful for working with related keys
 * 
 * @param key The full translation key
 * @param levels Number of levels to include in the base path
 * @returns The base path of the translation key
 */
export const getTranslationBasePath = (key: string, levels: number = 2): string => {
  const parts = key.split('.');
  return parts.slice(0, levels).join('.');
};

/**
 * Validates a set of related translation keys against a base path
 * 
 * @param basePath The base path for the keys (e.g., "FORM.ERRORS")
 * @param requiredKeys Array of required sub-keys
 * @returns Array of missing translation keys
 */
export const validateRelatedTranslations = (basePath: string, requiredKeys: string[]): string[] => {
  return requiredKeys
    .map(key => `${basePath}.${key}`)
    .filter(fullKey => !translationKeyExists(fullKey));
};
