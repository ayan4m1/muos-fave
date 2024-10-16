import eslint from '@eslint/js';
import { config, configs } from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintPluginImportX from 'eslint-plugin-import-x';

export default config(
  eslint.configs.recommended,
  ...configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  {
    settings: {
      'import-x/resolver': 'typescript'
    }
  },
  eslintPluginPrettier
);
