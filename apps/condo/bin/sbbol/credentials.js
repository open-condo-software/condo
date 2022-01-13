/**
 * Manages credentials through SBBOL API
 *
 * @example Loop through all organizations and refresh tokens:
 * yarn node apps/condo/bin/sbbol/credentials.js refresh-all-tokens
 *
 * @example Refresh client secret for specified clientId `1234` with passing old Client Secret `a1b2c3d4`
 * yarn node apps/condo/bin/sbbol/credentials.js refresh-client-secret 1234 a1b2c3d4
 */
const { values } = require('lodash')
const { SbbolCredentials } = require('@condo/domains/organization/integrations/sbbol/SbbolCredentials')


const COMMAND = {
    REFRESH_ALL_TOKENS: 'refresh-all-tokens',
    REFRESH_CLIENT_SECRET: 'refresh-client-secret',
}


const workerJob = async () => {
    const [command] = process.argv.slice(2)
    if (!values(COMMAND).includes(command)) {
        throw new Error('Wrong command.')
    }

    const credentialsManager = new SbbolCredentials()
    await credentialsManager.connect()

    if (command === COMMAND.REFRESH_ALL_TOKENS) {
        await credentialsManager.refreshAllTokens()
    }

    if (command === COMMAND.REFRESH_CLIENT_SECRET) {
        const [clientId, clientSecret] = process.argv.slice(3)
        if (!clientId) {
            throw new Error('cliendId should be specified as a first argument of the command')
        }
        if (!clientSecret) {
            throw new Error('Old clientSecret is not specified as a second argument of the command')
        }

        await credentialsManager.refreshClientSecret({ clientId, clientSecret })
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
