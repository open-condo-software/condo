module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        'jest/globals': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2019,
        sourceType: 'module',
    },
    plugins: [
        'react',
        'jest',
        '@typescript-eslint',
        'import',
    ],
    settings: {
        react: {
            version: 'detect',
        },
        'import/internal-regex': '^.*?/domains/.*?/.*',
    },
    ignorePatterns: [
        'dist',
        '*schema.ts',
        'apps/*/gql/*.ts',
    ],
    rules: {
        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': 'error',
        indent: 'off',
        '@typescript-eslint/indent': [
            'error',
            4,
            {
                SwitchCase: 1,
            },
        ],
        quotes: 'off',
        'jsx-quotes': [
            'error',
            'prefer-single',
        ],
        '@typescript-eslint/quotes': [
            'error',
            'single',
        ],
        semi: 'off',
        '@typescript-eslint/semi': [
            'error',
            'never',
        ],
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [
            'error',
            'always',
        ],
        'comma-dangle': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/comma-dangle': [
            'error',
            {
                functions: 'only-multiline',
                arrays: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                objects: 'always-multiline',
                enums: 'always-multiline',
                tuples: 'always-multiline',
                generics: 'always-multiline',
            },
        ],
        'object-curly-spacing': 'off',
        '@typescript-eslint/object-curly-spacing': [
            'error',
            'always',
        ],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'none',
            },
        ],
        'no-array-constructor': 'off',
        '@typescript-eslint/no-array-constructor': [
            'error',
        ],
        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': [
            'warn',
        ],
        'no-loss-of-precision': 'off',
        '@typescript-eslint/no-loss-of-precision': [
            'error',
        ],
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': [
            'error',
        ],
        'no-prototype-builtins': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/no-children-prop': 'off',
        'react/display-name': 'warn',
        'react/jsx-curly-brace-presence': [
            'error',
            {
                props: 'never',
                children: 'never',
            },
        ],
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/func-call-spacing': 'error',
        '@typescript-eslint/keyword-spacing': 'error',
        '@typescript-eslint/space-infix-ops': [
            'error',
            {
                int32Hint: false,
            },
        ],
        '@typescript-eslint/member-delimiter-style': [
            'warn',
            {
                multiline: {
                    delimiter: 'none',
                    requireLast: false,
                },
                singleline: {
                    delimiter: 'comma',
                    requireLast: false,
                },
            },
        ],
        '@typescript-eslint/no-empty-interface': 'off',
        'no-restricted-imports': [
            'warn',
            {
                paths: [
                    {
                        name: 'jspdf',
                        message: 'Please use pdfmake to generate pdf files.',
                    },
                ],
            },
        ],
        'no-restricted-modules': [
            'error',
            {
                patterns: ['@open-keystone/fields*', '@open-condo/keystone/fields'],
            },
        ],
        'no-restricted-syntax': [
            'warn',
            {
                selector: 'ImportDeclaration[source.value="lodash"] > ImportSpecifier',
                message: 'Use default import from "lodash/{method}" instead of named import from "lodash". Example: import set from "lodash/set"',
            },
            {
                selector: 'VariableDeclarator[id.type="ObjectPattern"][init.type="CallExpression"][init.callee.name="require"][init.arguments.0.value="lodash"]',
                message: 'Use require("lodash/{method}") instead of destructuring from require("lodash"). Example: const get = require("lodash/get")',
            },
        ],
        'import/order': [
            'error',
            {
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
                pathGroups: [
                    // Some libraries named as files.
                    // Something like `big.js` at `apps/condorb/domains/condorb/integration/sberSecurePay.js`
                    // To prevent recognizing as local file we add these libraries to the `external` group.
                    //
                    {
                        pattern: 'big.js',
                        group: 'external',
                    },
                    // packages
                    {
                        pattern: '@open-condo/**',
                        group: 'external',
                        position: 'after',
                    },
                ],
                'newlines-between': 'always',
                pathGroupsExcludedImportTypes: ['@open-condo'],
                distinctGroup: true,
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                warnOnUnassignedImports: false,
            },
        ],
    },
}
