import getConfig from 'next/config'

import { OIDCMiddleware } from '@open-condo/miniapp-utils/helpers/oidc'

import { getSession } from '@/domains/common/utils/session'


const {
    publicRuntimeConfig: {
        condoDomain,
        oidcClientId,
        serverUrl,
    },
    serverRuntimeConfig: {
        oidcClientSecret,
    },
} = getConfig()

export const condoOIDCMiddleware = new OIDCMiddleware({
    getSession,
    oidcConfig: {
        clientId: oidcClientId,
        clientSecret: oidcClientSecret,
        serverUrl: condoDomain,
    },
    redirectUri: `${serverUrl}/api/auth/condo/callback`,
})