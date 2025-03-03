/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: '@open-condo/keystone',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/**/*.spec.js'],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            // NOTE: need to pass bull export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(bull)/)'],
        },
    ],
}