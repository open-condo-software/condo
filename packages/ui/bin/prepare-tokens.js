const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const get = require('lodash/get')


/**
 * Splits tokens into separate sets by namespaces to process in style-dictionary correctly
 * Also calculates all refs and values
 * @param tokenFile name of src token file, if not specified token set from tokens.json used
 */
function prepareTokens (tokenFile) {
    const filename = tokenFile ? tokenFile : 'tokens.json'
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const tokenPath = path.join(__dirname, '../src/tokens', filename)
    const tokens = require(tokenPath)

    // Get information about traverse order
    const tokenSetOrder = get(tokens, ['$metadata', 'tokenSetOrder'], [])
    if (!tokenSetOrder.length) {
        throw new Error('Traverse order was not defined!')
    }

    const setsToParse = tokenSetOrder.join(',')

    for (let i = 0; i < tokenSetOrder.length; i++) {
        const setName = tokenSetOrder[i]
        // For each set (namespace) need to exclude all another sets except one
        const excludedSets = tokenSetOrder.slice(0, i).concat(tokenSetOrder.slice(i + 1, tokenSetOrder.length)).join(',')

        // Generate child process to transform tokens
        // nosemgrep: javascript.lang.security.audit.spawn-shell-true.spawn-shell-true
        const chile_process = spawn('yarn', [
            'workspace',
            '@open-condo/ui',
            'token-transformer',
            `src/tokens/${filename}`,
            `src/tokens/sets/${setName}.json`,
            setsToParse,
            excludedSets,
            '--expandTypography',
            '--throwErrorWhenNotResolved',
        ], {
            // Note: we need to use the same shell on windows to find `yarn` command
            //   and fix the `Error: spawn yarn ENOENT`. 
            shell: true,
        })

        // After set is created we need to wrap it wit setName
        // So the token will look like: <prefix>-<namespace>-...
        // instead of <prefix>-...
        chile_process.on('exit', code => {
            if (code === 0) {
                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const fileName = path.join(__dirname, `../src/tokens/sets/${setName}.json`)
                const file = require(fileName)
                fs.writeFileSync(fileName, JSON.stringify({
                    [setName]: file,
                }, null, 2))
                console.log(`✓ Set ${setName} is processed`)
            } else {
                throw Error(`✖ Error occurred while processing ${setName} set`)
            }
        })
    }
}

prepareTokens(...process.argv.slice(2))

