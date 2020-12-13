const availableLanguages = {
    'Node10': {
        runtime: 'Node.js10.16',
        handler: 'index.handler',
        preprocessor: (x) => (x)
    },
    'Python3': {
        runtime: 'Python3.6',
        handler: 'index.handler',
        preprocessor: (x) => (x)
    }
}

module.exports = availableLanguages
