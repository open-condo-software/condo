const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

class BinScript {
    /**
     * Initialize with path to entry point of Keystone application, that will be started in advance
     * @param keystoneEntryPointPath - path to entry point module of Keystone application
     */
    constructor (keystoneEntryPointPath = './index.js') {
        this.keystoneEntryPointPath = keystoneEntryPointPath
    }

    async execute (func) {
        const { keystone } = await prepareKeystoneExpressApp(
            path.resolve(this.keystoneEntryPointPath),
            { excludeApps: ['NextApp'] },
        )
        const context = await keystone.createContext({ skipAccessControl: true })

        func(context).then(() => {
            process.exit(0)
        }).catch(error => {
            console.error(error)
            process.exit(1)
        })
    }
}

module.exports = {
    BinScript,
}
