module.exports = {
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: [`${__dirname}/schema/**/*.test.js`, `${__dirname}/domains/**/schema/*.test.js`],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
        },
    ],
}
