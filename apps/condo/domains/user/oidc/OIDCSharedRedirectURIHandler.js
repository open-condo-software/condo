const { z } = require('zod')


const redirectUriSchema = z.object({
    grant_type: z.literal('authorization_code'),
    redirect_uri: z.url(),
    code: z.string(),
})

const authCodeSchema = z.object({
    clientId: z.string(),
    redirectUri: z.url(),
})

const clientSchema = z.object({
    redirectUris: z.array(z.string()),
})

// NOTE(SavelevMatthew) This is not obvious hack to make OIDC correctly work with proxies
// We already extended list of allowed redirect uris in configuration (search for enhancedRedirectUris)
// The problem is that during authorization OIDC provider stores redirect uri inside auth code
// So when server-to-server request occurs with code exchange, it throws invalid_grant error,
// because proxied redirect_uri from auth endpoint does not match one from code exchange
// To bypass this behaviour we perform lookup for oidc client by to obtain all allowed uris for client
// And if request uri from request is in allowed list, we replace redirect uri from auth code
// to request to successfully complete auth
// TL;DR We allow to start OIDC auth from single redirect uri, and finish with second one in terms of single OIDC client
function getOIDCSharedRedirectURIHandler (provider) {
    return async function handler (req, res, next) {
        try {
            // NOTE: taken from node_modules/oidc-provider/lib/shared/assemble_params.js
            const params = req.method === 'POST' ? req.body : req.query
            const { success: paramsSuccess } = redirectUriSchema.safeParse(params)
            if (paramsSuccess) {
                const { code, redirect_uri: redirectUriFromParams } = params
                const codeObj = await provider.AuthorizationCode.find(code)

                const { success: authDataSuccess, data: authData } = authCodeSchema.safeParse(codeObj)

                if (authDataSuccess && authData.redirectUri !== redirectUriFromParams) {
                    const { clientId, redirectUri: redirectUriFromAuth } = authData
                    const client = await provider.Client.find(clientId)
                    const { success: clientSuccess, data: clientData } = clientSchema.safeParse(client)

                    if (clientSuccess) {
                        const { redirectUris } = clientData
                        if (redirectUris.includes(redirectUriFromParams)) {
                            params.redirect_uri = redirectUriFromAuth
                        }
                    }
                }
            }

            next()
        } catch {
            // We can catch errors potentially in async block (provider calls),
            // so in these cases we just call next default handler like nothing happened
            next()
        }

    }
}

module.exports = {
    getOIDCSharedRedirectURIHandler,
}