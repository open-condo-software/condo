const querystring = require('querystring')
const dayjs = require('dayjs')
const conf = require('@open-condo/config')
const { SbbolRequestApi } = require('../SbbolRequestApi')
const { getOrganizationAccessToken } = require('./getOrganizationAccessToken')
const { getSbbolSecretStorage } = require('./getSbbolSecretStorage')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { Organization, OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const get = require('lodash/get')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

async function changeClientSecret ({ clientId, currentClientSecret, newClientSecret, userId }) {
    const sbbolSecretStorage = getSbbolSecretStorage()
    const { keystone: userContext } = await getSchemaCtx('User')

    const organization = await Organization.getOne(userContext, { importId: SBBOL_FINTECH_CONFIG.service_organization_hashOrgId } )
    if (!organization) {
        throw new Error('Could not fetch SBBOL service organization by importId with corresponds to SBBOL_FINTECH_CONFIG.service_organization_hashOrgId')
    }

    const employee = await OrganizationEmployee.getAll(userContext,
        {
            organization: { id: organization.id },
            deletedAt: null,
            isRejected: false,
            isBlocked: false,
        },
        { sortBy: ['createdAt_ASC'], first: 1 })
    const user = get(employee[0], 'user')

    if (!user) {
        throw new Error('Could not fetch User from SBBOL service organization')
    }
    const accessToken = await getOrganizationAccessToken(user.id)

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
        client_secret: currentClientSecret || await sbbolSecretStorage.getClientSecret(),
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
            await sbbolSecretStorage.setClientSecret(newClientSecret, { expiresAt: dayjs().add(clientSecretExpiration, 'days').unix() })
        }
    }
}

module.exports = {
    changeClientSecret,
}
