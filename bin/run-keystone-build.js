/**
 * This file is based on @keystonejs/keystone/bin/commands/build.js
 * The main reason is to better memory control!
 */

const path = require('path')

const chalk = require('chalk')

// NOTE: force to production (form keystone build.js)
// NOTE: it's required to set before the conf initialization
process.env.NODE_ENV = 'production'
process.env.PHASE = 'build'

const { prepareKeystoneInstance } = require('@open-condo/keystone/prepareKeystoneApp')

const CWD = process.cwd()

async function main () {
    const index = path.resolve('./index.js')

    console.log(chalk.gray.bold(`KEYSTONE 🚀 prepare keystone instance. index=${index}`))
    const { keystone, apps, distDir } = await prepareKeystoneInstance(index, {
        excludeApps: [
            'HealthCheck', 'RequestCache', 'AdapterCache', 'VersioningMiddleware', 'OIDCMiddleware',
        ],
    })

    if (apps) {
        const resolvedDistDir = path.resolve(CWD, distDir)
        console.log(chalk.gray.bold(`KEYSTONE 🏗️ building to ${resolvedDistDir}`))

        await Promise.all(
            apps.filter(app => app.build).map(app => app.build({ distDir: resolvedDistDir, keystone })),
        )

        console.log(chalk.green.bold('KEYSTONE 🏗️ done'))
    } else {
        console.log(chalk.red.bold('KEYSTONE 🏗️ nothing to build'))
    }

    return { keystone, apps }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
