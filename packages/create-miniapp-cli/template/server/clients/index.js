const conf = require('@open-condo/config')

const { CondoClient } = require('./condoClient')

// TODO: (AUTO_GENERATED): provide a fallback option for API_TARGET
const API_TARGET = conf['API_TARGET'] || 'API TARGET OF YOUR MINIAPP'
if (API_TARGET == 'API TARGET OF YOUR MINIAPP') {
    throw new Error('You need to provide API_TARGET environment variable and provide a fallback value')
}

let condoClient

/**
 * Returns signed-in condo client instance
 * @param {string} clientName - name of the client
 * @return {Promise<CondoClient>}
 */
async function getCondoClient (clientName = 'template') {
    if (!condoClient) {
        const condoAuthConfig = JSON.parse(conf['CONDO_CLIENT_AUTH_CONFIG'] || '{}')
        const condoServerUrl = conf['CONDO_DOMAIN']

        condoClient = new CondoClient({
            endpoint: `${condoServerUrl}/admin/api`,
            authRequisites: condoAuthConfig,
            opts: {
                clientName,
                customHeaders: { 'x-target': API_TARGET },
            },
        })

        await condoClient.signIn()
    }

    return condoClient
}

module.exports = {
    getCondoClient,
}
