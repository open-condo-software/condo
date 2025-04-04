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
            displayName: '@open-condo/billing specs',
            testEnvironment: 'node',
            transform: {
                '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
            },
            testMatch: ['<rootDir>/src/**/*.spec.ts'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.ts'],
        },
    ],
}
