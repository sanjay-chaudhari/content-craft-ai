import React, { useState, useEffect } from 'react';
import i18n from '../i18n';
import { findMissingTranslations } from './translationUtils';

/**
 * A development-only component that helps identify missing translations
 * This component should only be used during development
 */
const TranslationDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [allKeys, setAllKeys] = useState<string[]>([]);

  // Function to flatten translation object into dot notation keys
  const flattenTranslations = (obj: any, prefix = ''): string[] => {
    return Object.keys(obj).reduce((acc: string[], key: string) => {
      const pre = prefix.length ? `${prefix}.` : '';
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        acc.push(...flattenTranslations(obj[key], `${pre}${key}`));
      } else {
        acc.push(`${pre}${key}`);
      }
      return acc;
    }, []);
  };

  // Extract all translation keys on component mount
  useEffect(() => {
    const translations = i18n.getDataByLanguage(i18n.language)?.translation;
    if (translations) {
      const keys = flattenTranslations(translations);
      setAllKeys(keys);
    }
  }, []);

  // Function to scan the DOM for potential translation keys
  const scanForMissingTranslations = () => {
    // This is a simplified approach - in a real app you'd need more sophisticated scanning
    const allText = document.body.innerText;
    const potentialKeys = allText.match(/[A-Z_]+\.[A-Z_]+(\.[A-Z_]+)+/g) || [];
    
    // Check if these potential keys exist in translations
    const missing = findMissingTranslations(potentialKeys);
    setMissingKeys(missing);
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-aws-blue-dark text-aws-orange p-2 rounded shadow-lg"
      >
        🌐 Translation Debug
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-aws-blue-medium p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-aws-orange">Translation Debugger</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-aws-gray-300 hover:text-aws-orange"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={scanForMissingTranslations}
                className="bg-aws-blue-light text-aws-gray-100 px-4 py-2 rounded"
              >
                Scan for Missing Translations
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-aws-orange-light mb-2">
                Missing Translation Keys ({missingKeys.length})
              </h3>
              {missingKeys.length > 0 ? (
                <ul className="bg-aws-blue-dark p-2 rounded text-aws-gray-300">
                  {missingKeys.map((key) => (
                    <li key={key} className="mb-1">
                      {key}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-aws-gray-300">No missing keys detected</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-aws-orange-light mb-2">
                All Translation Keys ({allKeys.length})
              </h3>
              <div className="bg-aws-blue-dark p-2 rounded max-h-60 overflow-y-auto">
                {allKeys.map((key) => (
                  <div key={key} className="text-xs text-aws-gray-300 mb-1">
                    {key}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationDebugger;
