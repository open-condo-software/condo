module.exports = {
    projects: [
        {
            testRunner: 'jasmine2',
            displayName: '@open-condo/keystone',
            testEnvironment: 'node',
            testMatch: [`${__dirname}/**/*.spec.js`],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
            // NOTE: need to pass bull export syntax through babel
            transformIgnorePatterns: ['/node_modules/(?!(bull)/)'],
        },
    ],
}