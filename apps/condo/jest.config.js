const conf = require('@core/config')

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    // this is not working in jest =( https://github.com/facebook/jest/issues/11500
    // testTimeout: 1000000,
    silent: true,   
    verbose: false,
    // https://stackoverflow.com/questions/43864793/why-does-jest-runinband-speed-up-tests
    maxWorkers: conf.IN_CI ? 1 : 4, 
    noStackTrace: true,
    expand: false,
    notify: false,
    reporters: [
        'jest-clean-reporter',
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
