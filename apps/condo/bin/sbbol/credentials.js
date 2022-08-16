/**
 * Manages credentials through SBBOL API
 *
 * @example Loop through all organizations and refresh tokens:
 * yarn node apps/condo/bin/sbbol/credentials.js refresh-all-tokens
 *
 * @example Change client secret for clientId `1234` that have an old client secret `a1b2c3d4` to new value of `asdf12345`
 * yarn node apps/condo/bin/sbbol/credentials.js change-client-secret 1234 a1b2c3d4 asdf12345
 */
const path = require('path')
const { values } = require('lodash')

const conf = require('@condo/config')
const { getRandomString, prepareKeystoneExpressApp } = require('@condo/keystone/test.utils')

const { changeClientSecret, getOrganizationAccessToken } = require('@condo/domains/organization/integrations/sbbol/utils')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('../common')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}

const COMMAND = {
    REFRESH_ALL_TOKENS: 'refresh-all-tokens',
    CHANGE_CLIENT_SECRET: 'change-client-secret',
}

async function refreshAllTokens (context) {
    // we need to refresh all tokens once per month
    const organizations = await Organization.getAll(context, { importRemoteSystem: SBBOL_IMPORT_NAME })
    await Promise.all(organizations.map(async organization => {
        try {
            await getOrganizationAccessToken(context, organization.importId)
        } catch (error) {
            console.log(error)
        }
    }))
}

const workerJob = async () => {
    const [command] = process.argv.slice(2)
    if (!values(COMMAND).includes(command)) {
        throw new Error('Wrong command.')
    }

    const { keystone } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp'] })

    const context = await keystone.createContext({ skipAccessControl: true })

    if (command === COMMAND.REFRESH_ALL_TOKENS) {
        await refreshAllTokens(context)
    }

    if (command === COMMAND.CHANGE_CLIENT_SECRET) {
        let clientId, currentClientSecret, newClientSecret
        [clientId, currentClientSecret, newClientSecret] = process.argv.slice(3)
        if (!clientId && !currentClientSecret && !newClientSecret) {
            const { tokenSet } = await getOrganizationAccessToken(context, SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)
            currentClientSecret = tokenSet.clientSecret || SBBOL_AUTH_CONFIG.client_secret
            clientId = SBBOL_AUTH_CONFIG.client_id
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

        await changeClientSecret(context, { clientId, currentClientSecret, newClientSecret })
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
