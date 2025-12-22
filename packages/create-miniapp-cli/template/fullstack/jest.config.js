/** @type {import('jest').Config} */
/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'ts'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema',
            testEnvironment: 'node',
            transform: {
                '^.+\\.ts?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
            },
            testMatch: ['<rootDir>/schema/**/*.test.js', '<rootDir>/domains/**/schema/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupTest.js'],
            transformIgnorePatterns: ['/node_modules/(?!(uuid|msgpackr)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'spec',
            testEnvironment: 'node',
            testEnvironmentOptions: { url: 'http://localhost:3000/' },
            testMatch: ['<rootDir>/domains/**/*.spec.js'],
            transform: {
                '\\.[jt]sx$': 'babel-jest',
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
        },
    ],
}

