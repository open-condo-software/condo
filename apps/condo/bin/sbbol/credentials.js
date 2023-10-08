/**
 * Manages credentials through SBBOL API
 *
 * @example Loop through all organizations and refresh tokens:
 * yarn node apps/condo/bin/sbbol/credentials.js refresh-all-tokens
 *
 * @example Change client secret for clientId `1234` that have an old client secret `a1b2c3d4` to new value of `asdf12345`
 * yarn node apps/condo/bin/sbbol/credentials.js change-client-secret 1234 a1b2c3d4 asdf12345
 *
 * @example Set credentials manually
 * yarn node apps/condo/bin/sbbol/credentials.js set '{"clientSecret":"asdf12345"}'
 * yarn node apps/condo/bin/sbbol/credentials.js set '{"clientSecret":"asdf12345","accessToken":"dc808c8e-e070-4947-9d71-c984aaa9b2b7", "refreshToken":"dc808c8e-e070-4947-9d71-c984aaa9b2b8"}'
 *
 * @example Display credentials values
 * yarn node apps/condo/bin/sbbol/credentials.js get
 */
const Ajv = require('ajv')
const { values } = require('lodash')

const { getRandomString } = require('@open-condo/keystone/test.utils')

const { changeClientSecret, getSbbolSecretStorage } = require('@condo/domains/organization/integrations/sbbol/utils')

const COMMAND = {
    CHANGE_CLIENT_SECRET: 'change-client-secret',
    SET: 'set',
    GET: 'get',
}

const workerJob = async () => {
    const [command] = process.argv.slice(2)
    if (!values(COMMAND).includes(command)) {
        throw new Error('Wrong command.')
    }

    if (command === COMMAND.CHANGE_CLIENT_SECRET) {
        const sbbolSecretStorage = getSbbolSecretStorage()
        let clientId, currentClientSecret, newClientSecret, userId
        [clientId, currentClientSecret, newClientSecret, userId] = process.argv.slice(3)
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

        await changeClientSecret({ clientId, currentClientSecret, newClientSecret, userId })
    }

    if (command === COMMAND.GET) {
        const [userId] = process.argv.slice(3)
        const sbbolSecretStorage = getSbbolSecretStorage()
        const values = await sbbolSecretStorage.getRawKeyValues(userId)
        console.log('SbbolSecretStorage values: ', JSON.stringify(values, null, 2))
    }

    if (command === COMMAND.SET) {
        const rawValues = process.argv.slice(3)
        let values
        try {
            values = JSON.parse(rawValues)
        } catch (e) {
            console.error('Could not parse values as JSON')
            throw new Error(e)
        }
        const ajv = new Ajv()
        const validate = ajv.compile({
            '$schema': 'http://json-schema.org/draft-07/schema#',
            additionalProperties: false,
            properties: {
                clientSecret: {
                    type: 'string',
                },
                accessToken: {
                    type: 'string',
                },
                refreshToken: {
                    type: 'string',
                },
                userId: {
                    type: 'string',
                },
            },
        })
        if (!validate(values)) {
            throw new Error('Invalid values object provided. Valid values object is { clientSecret, accessToken, refreshToken }. It may contain only needed keys', values)
        }
        console.debug('Values to be set', values)
        const sbbolSecretStorage = getSbbolSecretStorage()
        const { clientSecret, accessToken, refreshToken, userId } = values
        if (clientSecret) {
            await sbbolSecretStorage.setClientSecret(clientSecret)
            console.debug('Set clientSecret', clientSecret)
        }
        if (accessToken) {
            await sbbolSecretStorage.setAccessToken(accessToken, userId)
            console.debug('Set accessToken', accessToken, 'for userId', userId)
        }
        if (refreshToken) {
            await sbbolSecretStorage.setRefreshToken(refreshToken, userId)
            console.debug('Set refreshToken', refreshToken, 'for userId', userId)
        }
        console.log('Done.')
        process.exit(0)
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
