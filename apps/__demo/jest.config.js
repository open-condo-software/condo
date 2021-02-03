module.exports = {
    testURL: 'http://localhost:3000/',
    collectCoverageFrom: [
        '**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        // '!**/.next/**',
    ],
    setupFilesAfterEnv: [`${__dirname}/jest.setup.js`],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    // moduleNameMapper: {
    //     '^(@core)/(.*?)/(.*?)$': `${__dirname}/../../packages/$1.$2/$3`
    // },
    transformIgnorePatterns: [
        'node_modules', '.next',
    ],
}
