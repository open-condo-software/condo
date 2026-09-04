const {
    fixupConfigRules,
    fixupPluginRules,
} = require('@eslint/compat')
const {
    FlatCompat,
} = require('@eslint/eslintrc')
const js = require('@eslint/js')
const typescriptEslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const _import = require('eslint-plugin-import')
const jest = require('eslint-plugin-jest')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const globals = require('globals')

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
})

module.exports = [
    {
        ignores: [
            '**/dist',
            '**/out',
            '**/__generated__',

            '**/.next',
            '**/node_modules',
            '**/.venv',
            '**/next-env.d.ts',

            'packages/codegen/templates',
            '**/test*',
            '**/package.json',
            '**/README.md',
            '**/*schema.ts',
            '**/gql/*.ts',
            '**/public',
        ],
    },
    ...fixupConfigRules(compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    )),
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...jest.environments.globals.globals,
                URLPattern: 'readonly',
            },

            parser: tsParser,
            ecmaVersion: 2019,
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        plugins: {
            react: fixupPluginRules(react),
            'react-hooks': fixupPluginRules(reactHooks),
            jest,
            '@typescript-eslint': fixupPluginRules(typescriptEslint),
            import: fixupPluginRules(_import),
        },

        settings: {
            react: {
                version: 'detect',
            },

            'import/internal-regex': '^.*?/domains/.*?/.*',
        },

        rules: {
            'comma-spacing': ['error', { before: false, after: true }],
            indent: ['error', 4, {
                SwitchCase: 1,
            }],
            quotes: ['error', 'single'],
            'jsx-quotes': ['error', 'prefer-single'],
            semi: ['error', 'never'],
            'space-before-function-paren': ['error', 'always'],
            'comma-dangle': ['error', {
                functions: 'only-multiline',
                arrays: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                objects: 'always-multiline',
            }],
            'object-curly-spacing': ['error', 'always'],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                args: 'none',
            }],
            'no-array-constructor': 'off',
            '@typescript-eslint/no-array-constructor': ['error'],
            'no-loop-func': 'off',
            '@typescript-eslint/no-loop-func': ['warn'],
            'no-loss-of-precision': 'off',
            '@typescript-eslint/no-loss-of-precision': ['error'],
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-useless-constructor': ['error'],
            'no-prototype-builtins': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-children-prop': 'off',
            'react/display-name': 'warn',
            'react-hooks/incompatible-library': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/refs': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/exhaustive-deps': 'off',
            'react-hooks/preserve-manual-memoization': ['warn'],

            'react/jsx-curly-brace-presence': ['error', {
                props: 'never',
                children: 'never',
            }],

            'react/no-unknown-property': ['error', {
                ignore: ['css'],
            }],

            'jest/no-disabled-tests': 'warn',
            'jest/no-focused-tests': 'error',
            'jest/no-identical-title': 'error',
            'jest/prefer-to-have-length': 'warn',
            'jest/valid-expect': 'error',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/ban-ts-comment': 'warn',
            'func-call-spacing': ['error', 'never'],
            'keyword-spacing': ['error'],
            'space-infix-ops': ['error'],

            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-useless-assignment': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],

            'no-restricted-imports': ['warn', {
                paths: [{
                    name: 'jspdf',
                    message: 'Please use pdfmake to generate pdf files.',
                }],
            }],

            'no-restricted-modules': ['error', {
                patterns: ['@open-keystone/fields*', '@open-condo/keystone/fields'],
            }],

            'no-restricted-syntax': ['warn', {
                selector: 'ImportDeclaration[source.value="lodash"]',
                message: 'Use specific lodash imports instead. Example: import get from "lodash/get"',
            }, {
                selector: 'VariableDeclarator[id.type="ObjectPattern"][init.type="CallExpression"][init.callee.name="require"][init.arguments.0.value="lodash"]',
                message: 'Use require("lodash/{method}") instead of destructuring from require("lodash"). Example: const get = require("lodash/get")',
            }, {
                selector: 'VariableDeclarator[init.type="CallExpression"][init.callee.name="require"][init.arguments.0.value="lodash"]',
                message: 'Use specific lodash imports instead. Example: const get = require("lodash/get")',
            }],

            'preserve-caught-error': 'off',

            'import/order': ['error', {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'sibling',
                    'parent',
                    'index',
                    'object',
                    'type',
                ],

                pathGroups: [{
                    pattern: 'big.js',
                    group: 'external',
                }, {
                    pattern: '@open-condo/**',
                    group: 'external',
                    position: 'after',
                }],

                'newlines-between': 'always',
                pathGroupsExcludedImportTypes: ['@open-condo'],
                distinctGroup: true,

                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },

                warnOnUnassignedImports: false,
            }],
        },
    },
    {
        files: ['packages/keystone/**/*'],
        rules: {
            'no-restricted-modules': 'off',
        },
    },
]
