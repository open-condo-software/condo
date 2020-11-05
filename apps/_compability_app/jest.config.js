module.exports = {
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    transform: {
        '^.+\\.(js|jsx)?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules', '.next',
    ],
}
