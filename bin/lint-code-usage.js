const fs = require('node:fs')
const path = require('path')

const { parse, each, has } = require('abstract-syntax-tree')

const FOLDER = 'apps/condo/domains'

// TODO: use semgrep https://semgrep.dev/docs/writing-rules/rule-ideas/#systematize-project-specific-coding-patterns

function *walkSync (dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        if (file.isDirectory()) {
            yield* walkSync(path.join(dir, file.name))
        } else {
            yield path.join(dir, file.name)
        }
    }
}

for (const filePath of walkSync(FOLDER)) {
    parseAST(filePath)
        .then(analyse)
}

async function parseAST (fileName) {
    const codeBuffer = fs.readFileSync(fileName)
    const code = codeBuffer.toString()
    return { tree: parse(code), fileName }
}

async function analyse ({ tree, fileName }){
    analyseLoggerUsage(tree, (node) => {
        console.debug('Incorrect usage of "logger", being called without "msg" property', { fileName })
    })
}

/**
 * Analyses incorrect usage of `logger` object
 * Incorrect usage means that `logger` object methods are called without `msg` property
 * @param tree
 * @param incorrectUsageCallback
 */
function analyseLoggerUsage (tree, incorrectUsageCallback){
    each(tree, 'CallExpression', node => {
        if (has(node, 'MemberExpression [name="logger"]')) {
            const correctUsage = has(node, '[arguments] [properties] [key] [type="Identifier"][name="msg"]')
            if (!correctUsage) {
                incorrectUsageCallback(node)
            }
        }
    })
}
