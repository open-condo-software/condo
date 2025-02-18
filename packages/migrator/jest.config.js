/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: './',
    testPathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'ts'],
    projects: [
        {
            displayName: '@open-condo/migrator',
            testEnvironment: 'node',
            transform: {
                '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
            },
            testMatch: [
                '<rootDir>/src/**/*.spec.ts',
                '<rootDir>/src/**/*.test.ts',
            ],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1',
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.ts'],
        },
    ],
}