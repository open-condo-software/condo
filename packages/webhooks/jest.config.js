/** @type {import('jest').Config} */
module.exports = {
    rootDir: './',
    reporters: ['default', '<rootDir>/../../bin/report-failed-tests.js'],
    projects: [
        {
            displayName: 'Specs',
            testEnvironment: 'node',
            testRunner: 'jasmine2',
            testMatch: ['<rootDir>/**/*.spec.js'],
            testPathIgnorePatterns: ['/tasks/'],
            setupFilesAfterEnv: ['<rootDir>/jest.setupSpec.js'],
        },
    ],
}
