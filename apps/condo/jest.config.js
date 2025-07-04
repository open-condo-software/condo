/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema tests',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/schema/**/*.test.js',
                '<rootDir>/domains/**/schema/*.test.js',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setupTest.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|msgpackr|n2words)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'schema specs',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/domains/**/schema/**/*.spec.[tj]s',
            ],
            transform: {
                '\\.[jt]sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|bull|msgpackr|n2words)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'main',
            testEnvironment: 'node',
            testPathIgnorePatterns: [
                '/node_modules/',
                '/.next/',
                '/dist/',
                '/.kmigrator/',
                '/schema/',
            ],
            transform: {
                '\\.[jt]sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|nanoid|msgpackr|n2words)/)'],
            moduleNameMapper: {
                '@open-condo/next/(.*)': '<rootDir>/../../packages/next/$1',
            },
        },
    ],
}
