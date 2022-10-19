module.exports = {
    projects: [
        {
            displayName: 'Specs',
            testEnvironment: 'node',
            testRunner: 'jasmine2',
            testMatch: [`${__dirname}/**/*.spec.js`],
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
        },
    ],
}
