/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/schema/**/*.test.js', '<rootDir>/domains/**/schema/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupTest.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'main',
            testEnvironment: 'jsdom',
            testURL: 'http://localhost:3000/',
            testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/.kmigrator/', '/schema/'],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
    ],
}
