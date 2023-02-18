/**
 * This file is based on @keystonejs/keystone/bin/commands/dev.js
 * The main reason is to add PORT environment support for `yarn dev` command!
 * You can now use command like so: `PORT=3002 yarn dev`
 * Or put PORT inside your .env file
 */
const path = require('path')

const { getEntryFileFullPath, executeDefaultServer } = require('@keystonejs/keystone/bin/utils')
const ciInfo = require('ci-info')
const ora = require('ora')

const conf = require('@open-condo/config')

const spinner = ora({
    text: 'Initialising Keystone CLI',
    // Don't show any loading output on CI
    isSilent: !!ciInfo.isCi,
}).start()

const info = {
    exeName: __filename,
    _cwd: process.cwd(),
}

const args = {
    ['--port']: conf['PORT'],
    ['--entry']: 'index.js',
    ['--app-url']: conf['SERVER_URL'],
}

async function main () {
    spinner.text = 'Validating project entry file'
    const entryFile = await getEntryFileFullPath(args, info)
    spinner.succeed(`Validated project entry file ./${path.relative(info._cwd, entryFile)}`)
    spinner.start(' ')
    await executeDefaultServer(args, entryFile, undefined, spinner)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
