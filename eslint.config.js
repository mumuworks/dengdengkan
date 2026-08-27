import js from '@eslint/js'
import globals from 'globals'
import reactHooksPkg from 'eslint-plugin-react-hooks'
import reactRefreshPkg from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const reactHooks = reactHooksPkg.default ?? reactHooksPkg
const reactRefresh = reactRefreshPkg.default ?? reactRefreshPkg

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
  },
)
