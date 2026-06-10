const { z } = require('zod')

const conf = require('@open-condo/config')
const { getByCondition } = require('@open-condo/keystone/schema')
const { replaceDomainPrefix } = require('@open-condo/miniapp-utils/helpers/urls')

const { getGQLErrorValidator } = require('@condo/domains/common/schema/json.utils')

function getMappedTargetOrigin (sourceOrigin, appId, idx) {
    const targetUrl = new URL(replaceDomainPrefix(conf['SERVER_URL'], `${appId}-${idx}.miniapps`))
    if (new URL(sourceOrigin).protocol === 'wss:') {
        targetUrl.protocol = 'wss:'
    }
    return targetUrl.origin
}

const OIDC_CLIENT_FIELD = {
    schemaDoc: 'Relation to OIDC configuration, which application use for authorization',
    type: 'Relationship',
    ref: 'OidcClient',
    isRequired: false,
    kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
}

const ADDITIONAL_DOMAINS_FIELD = {
    schemaDoc: 'List of additional domains that miniapp uses in its work and that need to be proxied for the application to work correctly',
    type: 'Json',
    graphQLReturnType: '[String!]',
    graphQLInputType: '[String!]',
    isRequired: true,
    defaultValue: [],
    hooks: {
        validateInput: getGQLErrorValidator(z.array(z.url({ protocol: /^(https|wss)$/ })), 'INVALID_MINIAPP_DOMAINS'),
    },
}

const MINIAPP_DOMAINS_FIELD = {
    schemaDoc: 'List of mapping from condo-hosted domain to miniapp-defined domain',
    type: 'Virtual',
    extendGraphQLTypes: [
        'type MiniappDomainMapping { from: String!, to: String! }',
        'type MiniappDomains { mapping: [MiniappDomainMapping!]! }',
    ],
    graphQLReturnType: 'MiniappDomains',
    graphQLReturnFragment: '{ mapping { from to } }',
    resolver: async (item) => {
        let oidcRedirectURIS = [null]

        if (item.oidcClient) {
            const client = await getByCondition('OidcClient', { id: item.oidcClient, deletedAt: null })
            if (client && client.payload && client.payload.redirect_uris && client.payload.redirect_uris.length) {
                oidcRedirectURIS = client.payload.redirect_uris
            }
        }

        // NOTE: for now we internally decide, that:
        // for app entrypoint we will use index 1 (app frontend),
        // for app oidc domains we will use index 2 (app backend)
        // for app additional domains (including extra oidc endpoints) we will use index 3+
        // If app frontend and

        const mapping = []
        const mappedOrigins = []
        const mappedHostToIdx = new Map()

        function addMapping (origin, preferredIdx) {
            if (mappedOrigins.includes(origin)) return preferredIdx

            const hostKey = new URL(origin).host
            let targetIdx = preferredIdx
            if (mappedHostToIdx.has(hostKey)) {
                targetIdx = mappedHostToIdx.get(hostKey)
            } else {
                mappedHostToIdx.set(hostKey, preferredIdx)
            }

            mappedOrigins.push(origin)
            mapping.push({
                from: origin,
                to: getMappedTargetOrigin(origin, item.id, targetIdx),
            })

            return targetIdx === preferredIdx ? preferredIdx + 1 : preferredIdx
        }

        let idx = 2
        for (const redirectUri of oidcRedirectURIS) {
            if (!redirectUri) continue
            idx = addMapping((new URL(redirectUri)).origin, idx)
        }

        if (item.appUrl) {
            const origin = (new URL(item.appUrl)).origin
            if (!mappedOrigins.includes(origin)) {
                const hostKey = new URL(origin).host
                const targetIdx = mappedHostToIdx.has(hostKey) ? mappedHostToIdx.get(hostKey) : 1
                if (!mappedHostToIdx.has(hostKey)) {
                    mappedHostToIdx.set(hostKey, 1)
                }
                mappedOrigins.push(origin)
                mapping.push({
                    from: origin,
                    to: getMappedTargetOrigin(origin, item.id, targetIdx),
                })
            }
        }

        idx = Math.max(idx, 3)

        for (const domain of item.additionalDomains) {
            if (!domain) continue
            idx = addMapping((new URL(domain)).origin, idx)
        }

        return { mapping }
    },
}

module.exports = {
    OIDC_CLIENT_FIELD,
    MINIAPP_DOMAINS_FIELD,
    ADDITIONAL_DOMAINS_FIELD,
}
