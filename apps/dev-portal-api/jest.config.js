module.exports = {
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'schema tests',
            testEnvironment: 'node',
            testMatch: [`${__dirname}/schema/**/*.test.js`, `${__dirname}/domains/**/schema/*.test.js`],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'schema specs',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/domains/**/schema/**/*.spec.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
        },
    ],
}
