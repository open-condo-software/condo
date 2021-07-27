module.exports = {
    // this is not working in jest =(
    // https://github.com/facebook/jest/issues/11500
    // testTimeout: 1000000,
    silent: true,    
    reporters: [
        'default',
        [
            'jest-stare',
            {
                resultDir: './dist/jest-stare',
            },
        ],
    ],
    projects: [
        {
            displayName: 'schema',
            testEnvironment: 'node',
            testMatch: [`${__dirname}/schema/**/*.test.js`, `${__dirname}/domains/**/schema/*.test.js`],
            setupFilesAfterEnv: [`${__dirname}/jest.setup.js`],
            testEnvironmentOptions: {
                testTimeout: 1000000,
            },
        },
        {
            displayName: 'main',
            testEnvironment: 'jsdom',
            testURL: 'http://localhost:3000/',
            testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/.kmigrator/', '/schema/'],
            transform: {
                '\\.[jt]sx?$': 'babel-jest',
            },
        },
    ],
}
