/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema tests',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/schema/**/*.test.js', '<rootDir>/domains/**/schema/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupTest.js'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'schema specs',
            testEnvironment: 'node',
            testMatch: [
                '<rootDir>/domains/**/schema/**/*.spec.js',
            ],
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
        },
    ],
}
