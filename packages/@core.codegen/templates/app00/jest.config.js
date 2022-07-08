module.exports = {
    projects: [
        {
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: [`${__dirname}/schema/**/*.test.js`, `${__dirname}/domains/**/schema/*.test.js`],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
        },
        {
            displayName: 'main',
            testEnvironment: 'jsdom',
            testURL: 'http://localhost:3000/',
            testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/.kmigrator/', '/schema/'],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
        },
    ],
}
