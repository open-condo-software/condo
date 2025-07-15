/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/schema/**/*.test.js',
                '<rootDir>/domains/**/schema/*.test.js',
                '<rootDir>/domains/common/utils/services/**/*.test.js',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setupTest.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'spec',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/**/*.spec.js'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?! (uuid)/)'],
        },
    ],
}
