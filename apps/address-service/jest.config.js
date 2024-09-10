module.exports = {
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: 'main',
            testEnvironment: 'jsdom',
            testEnvironmentOptions: {
                url: 'http://localhost:3000/',
            },
            testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/.kmigrator/', '/schema/'],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/schema/**/*.test.js`,
                `${__dirname}/domains/**/schema/*.test.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupTest.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
        {
            testRunner: 'jasmine2',
            displayName: 'common spec',
            testEnvironment: 'node',
            testMatch: [
                `${__dirname}/domains/common/utils/**/*.spec.js`,
            ],
            setupFilesAfterEnv: [`${__dirname}/jest.setupSpec.js`],
            // NOTE: need to pass uuid export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],
        },
    ],
}
