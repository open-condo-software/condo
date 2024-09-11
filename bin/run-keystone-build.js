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

        for (const app of apps) {
            if (!app.build) continue
            console.log(chalk.gray.bold(`KEYSTONE 🏗️ building ${app.constructor.name}`))
            await app.build({ distDir: resolvedDistDir, keystone })
            console.log(chalk.green.bold(`KEYSTONE 🏗️ done ${app.constructor.name}`))
        }

        console.log(chalk.green.bold('KEYSTONE 🏗️ all done !'))
    } else {
        console.log(chalk.red.bold('KEYSTONE 🏗️ nothing to build'))
    }

    return { keystone, apps }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.log(chalk.red.bold('KEYSTONE 🏗️ error'))
        console.error(e)
        process.exit(1)
    })
