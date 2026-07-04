import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import tailwind from 'eslint-plugin-tailwindcss';

export default [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'playground-1.mongodb.js',
      'dns_test.js',
      'web-app-next/**',
      'src/types/**',
      'src/test/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
      security,
      tailwindcss: tailwind,
    },
    settings: {
      react: { version: 'detect' },
      tailwindcss: {
        config: './tailwind.config.js',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...security.configs.recommended.rules,
      
      // Strict Hooks & Type Safety
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      
      // Eliminate Dead Code & Loose Rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_', 
        'varsIgnorePattern': '^_' 
      }],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      
      // Styling Rules
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
    },
  },
];
