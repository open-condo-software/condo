/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    testPathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'ts'],
    projects: [
        {
            displayName: '@open-condo/miniapp-utils',
            testEnvironment: 'node',
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
            },
            testMatch: [
                '<rootDir>/src/**/*.spec.ts',
                '<rootDir>/src/**/*.test.ts',
            ],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
        },
    ],
}