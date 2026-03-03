# Translation System

This directory contains utilities for managing translations in the application.

## Overview

The translation system has been designed to provide consistent, maintainable, and error-resistant internationalization across the application. It addresses common issues like:

- Missing translation keys
- Inconsistent translation usage
- Duplicate translation strings
- Placeholder text showing instead of proper translations

## Key Components

### 1. `useTranslationHelper.ts`

A custom hook that wraps react-i18next's `useTranslation` hook to provide consistent translation behavior:

- Handles missing translations gracefully
- Provides key existence checking
- Supports dynamic translation keys
- Logs warnings for missing translations in development

### 2. `translationUtils.ts`

Utility functions for working with translations:

- `translationKeyExists`: Checks if a translation key exists
- `findMissingTranslations`: Finds missing translation keys
- `formatTranslationKey`: Ensures consistent key formatting
- `getTranslationBasePath`: Extracts base path from a key
- `validateRelatedTranslations`: Validates related keys

### 3. `TranslationContext.tsx`

A React context provider for translations:

- Centralizes translation functionality
- Provides consistent API across components
- Handles missing translations
- Supports language switching

### 4. `TranslationDebugger.tsx`

A development-only component for debugging translations:

- Shows all translation keys
- Identifies missing translations
- Only appears in development mode

## Best Practices

1. **Use the custom hook**: Always use `useTranslationHelper()` instead of direct react-i18next hooks
2. **Organize translations hierarchically**: Follow the pattern `SECTION.COMPONENT.KEY`
3. **Avoid hardcoded strings**: All user-facing text should use the translation system
4. **Group related translations**: Keep related translations together in the JSON file
5. **Use the debugger**: In development, use the TranslationDebugger to identify issues

## Example Usage

```tsx
import { useTranslationHelper } from '../utils/useTranslationHelper';

const MyComponent: React.FC = () => {
  const { t, keyExists, dynamicTranslate } = useTranslationHelper();
  
  // Basic translation
  const title = t('MY_COMPONENT.TITLE');
  
  // Translation with parameters
  const welcome = t('MY_COMPONENT.WELCOME', { name: 'User' });
  
  // Dynamic translation (useful for form fields, errors, etc.)
  const fieldLabel = dynamicTranslate('FORM.FIELDS', 'EMAIL');
  
  // Check if a key exists before using it
  const hasHelpText = keyExists('MY_COMPONENT.HELP_TEXT');
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{welcome}</p>
      <label>{fieldLabel}</label>
      {hasHelpText && <p>{t('MY_COMPONENT.HELP_TEXT')}</p>}
    </div>
  );
};
```
