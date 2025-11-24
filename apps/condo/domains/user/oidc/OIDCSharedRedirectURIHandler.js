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

function getOIDCSharedRedirectURIHandler (provider) {
    return async function handler (req, res, next) {
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
    }
}

module.exports = {
    getOIDCSharedRedirectURIHandler,
}