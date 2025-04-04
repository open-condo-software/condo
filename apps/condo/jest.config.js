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
                '<rootDir>/domains/**/schema/**/*.spec.js',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|bull|msgpackr|n2words)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'main',
            testEnvironment: 'jsdom',
            testURL: 'http://localhost:3000/',
            testPathIgnorePatterns: [
                '/node_modules/',
                '/.next/',
                '/dist/',
                '/.kmigrator/',
                '/schema/',
            ],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|nanoid|msgpackr|n2words)/)'],
            moduleNameMapper: {
                '^@open-condo/billing/(.*)$': '<rootDir>/../../packages/billing/dist/$1', // ts package has transpiled modules at dist
                '^@open-condo/(.*)$': '<rootDir>/../../packages/$1',
            },
        },
    ],
}
