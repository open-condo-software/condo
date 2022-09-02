const { SbbolRequestApi } = require('../SbbolRequestApi')
const querystring = require('querystring')
const { TokenSet } = require('@condo/domains/organization/utils/serverSchema')
const dayjs = require('dayjs')
const conf = require('@condo/config')
const { getOrganizationAccessToken } = require('./getOrganizationAccessToken')
const { dvSenderFields } = require('../constants')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

async function changeClientSecret (context, { clientId, currentClientSecret, newClientSecret }) {
    // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
    // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
    const { accessToken, tokenSet } = await getOrganizationAccessToken(context, SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)

    const requestApi = new SbbolRequestApi({
        accessToken,
        host: SBBOL_FINTECH_CONFIG.host,
        port: SBBOL_FINTECH_CONFIG.port,
        certificate: SBBOL_PFX.certificate,
        passphrase: SBBOL_PFX.passphrase,
    })

    const body = {
        access_token: accessToken,
        client_id: clientId,
        client_secret: currentClientSecret || tokenSet.clientSecret,
        new_client_secret: newClientSecret,
    }

    // SBBOL does not accepts parameters from body of the POST-request, as it usually should be implemented.
    // It accepts parameters from URL query string
    const queryParams = querystring.stringify(body)

    const { data, statusCode } = await requestApi.request({
        method: 'POST',
        path: `/ic/sso/api/v1/change-client-secret?${queryParams}`,
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (statusCode !== 200) {
        throw new Error('Something went wrong, SBBOL sent not successful response.')
    } else {
        if (data) {
            const jsonData = JSON.parse(data)
            const { clientSecretExpiration } = jsonData
            if (!clientSecretExpiration) {
                throw new Error('clientSecretExpiration is missing in response, so, It\'s unknown, when new client secret will be expired')
            }
            await TokenSet.update(context, tokenSet.id, {
                ...dvSenderFields,
                clientSecret: newClientSecret,
                clientSecretExpiresAt: dayjs().add(clientSecretExpiration, 'days').toISOString(),
            })
        }
    }
}

module.exports = {
    changeClientSecret,
}