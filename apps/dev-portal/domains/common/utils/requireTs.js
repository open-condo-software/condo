const fs = require('fs')

const babel = require('@babel/core')

// NOTE: Allow to use ts constants in JS file
// SRC: https://github.com/vercel/next.js/discussions/35969#discussioncomment-4819273
function requireTs (path) {
    const fileContent = fs.readFileSync(path, 'utf8')
    const compiled = babel.transform(fileContent, {
        filename: path,
        presets: ['@babel/preset-typescript', '@babel/preset-env'],
    })
    const Module = module.constructor
    const m = new Module()
    m._compile(compiled.code, path)

    return m.exports
}

module.exports = {
    requireTs,
}