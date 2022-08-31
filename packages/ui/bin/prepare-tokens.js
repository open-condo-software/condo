const path = require('path')
const get = require('lodash/get')
const { spawn } = require('child_process')
const fs = require('fs')


/**
 * Splits tokens into separate sets by namespaces to process in style-dictionary correctly
 * Also calculates all refs and values
 * @param tokenFile name of src token file, if not specified token set from tokens.json used
 */
function prepareTokens (tokenFile) {
    const filename = tokenFile ? tokenFile : 'tokens.json'
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
        const chile_process = spawn('yarn', [
            'workspace',
            '@condo/ui',
            'token-transformer',
            `src/tokens/${filename}`,
            `src/tokens/sets/${setName}.json`,
            setsToParse,
            excludedSets,
            '--expandTypography',
            '--throwErrorWhenNotResolved',
        ])

        // After set is created we need to wrap it wit setName
        // So the token will look like: <prefix>-<namespace>-...
        // instead of <prefix>-...
        chile_process.on('exit', code => {
            if (code === 0) {
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

