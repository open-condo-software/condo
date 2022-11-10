module.exports = {
    projects: [
        {
            displayName: 'schema tests',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/schema/**/*.test.js`,
                `${__dirname}/domains/**/schema/*.test.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
        },
        {
            displayName: 'schema specs',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/domains/**/schema/*.spec.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
        },
        {
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
        },
    ],
}
