/*
 * This maps the necessary packages to a version.
 * This improves performance significantly over fetching it from the npm registry.
 */
export const dependencyVersionMap = {
    // eslint / prettier
    prettier: '^3.5.3',
    '@eslint/eslintrc': '^3.3.1',
    'prettier-plugin-tailwindcss': '^0.6.11',
    eslint: '^9.23.0',
    'eslint-config-next': '^15.2.3',
    'eslint-plugin-drizzle': '^0.2.3',
    'typescript-eslint': '^8.27.0',
} as const
export type AvailableDependencies = keyof typeof dependencyVersionMap
