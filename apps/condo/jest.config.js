/** @type {import('jest').Config} */
module.exports = {
    workerIdleMemoryLimit: '256MB',
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema tests',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/schema/**/*.test.js`,
                `${__dirname}/domains/**/schema/*.test.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|msgpackr)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'schema specs',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/domains/**/schema/**/*.spec.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|bull|msgpackr)/)'],
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
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid|nanoid|msgpackr)/)'],
        },
    ],
}
