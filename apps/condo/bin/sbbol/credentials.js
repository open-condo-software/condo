/**
 * Manages credentials through SBBOL API
 *
 * @example Loop through all organizations and refresh tokens:
 * yarn node apps/condo/bin/sbbol/credentials.js refresh-all-tokens
 *
 * @example Change client secret for clientId `1234` that have an old client secret `a1b2c3d4` to new value of `asdf12345`
 * yarn node apps/condo/bin/sbbol/credentials.js change-client-secret 1234 a1b2c3d4 asdf12345
 */
const { values } = require('lodash')
const { SbbolCredentials } = require('@condo/domains/organization/integrations/sbbol/SbbolCredentials')


const COMMAND = {
    REFRESH_ALL_TOKENS: 'refresh-all-tokens',
    CHANGE_CLIENT_SECRET: 'change-client-secret',
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

    if (command === COMMAND.CHANGE_CLIENT_SECRET) {
        const [clientId, currentClientSecret, newClientSecret] = process.argv.slice(3)
        if (!clientId) {
            throw new Error('cliendId should be specified as a first argument of the command')
        }
        if (!currentClientSecret) {
            throw new Error('Old clientSecret should be specified as a second argument of the command')
        }
        if (!newClientSecret) {
            throw new Error('New clientSecret should be specified as a third argument of the command')
        }

        await credentialsManager.refreshClientSecret({ clientId, currentClientSecret, newClientSecret })
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
