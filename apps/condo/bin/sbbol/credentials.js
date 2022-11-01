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
const { getRandomString } = require('@condo/keystone/test.utils')
const { changeClientSecret } = require('@condo/domains/organization/integrations/sbbol/utils')
const { sbbolSecretStorage } = require('@condo/domains/organization/integrations/sbbol/singletons')

const COMMAND = {
    CHANGE_CLIENT_SECRET: 'change-client-secret',
}

const workerJob = async () => {
    const [command] = process.argv.slice(2)
    if (!values(COMMAND).includes(command)) {
        throw new Error('Wrong command.')
    }

    if (command === COMMAND.CHANGE_CLIENT_SECRET) {
        let clientId, currentClientSecret, newClientSecret
        [clientId, currentClientSecret, newClientSecret] = process.argv.slice(3)
        if (!clientId && !currentClientSecret && !newClientSecret) {
            currentClientSecret = await sbbolSecretStorage.getClientSecret()
            clientId = sbbolSecretStorage.clientId
            newClientSecret = getRandomString()
            console.log(`Run with: ${clientId} "${currentClientSecret}" "${newClientSecret}"`)
        } else {
            if (!clientId) {
                throw new Error('cliendId should be specified as a first argument of the command')
            }
            if (!currentClientSecret) {
                throw new Error('Old clientSecret should be specified as a second argument of the command')
            }
            if (!newClientSecret) {
                throw new Error('New clientSecret should be specified as a third argument of the command')
            }
        }

        await changeClientSecret({ clientId, currentClientSecret, newClientSecret })
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
