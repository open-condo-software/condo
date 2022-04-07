const express = require('express')
const Provider = require('oidc-provider')

const conf = require('@core/config')
const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')

const configuration = require('./configuration')
const { OIDCBearerTokenKeystonePatch } = require('./OIDCBearerTokenKeystonePatch')
const { logger } = require('./logger')

class OIDCMiddleware {
    prepareMiddleware ({ keystone, dev, distDir }) {
        const provider = new Provider(conf.SERVER_URL, configuration)
        const app = express()

        OIDCBearerTokenKeystonePatch(app)

        // We have a proxy in front that terminates ssl, you should trust the proxy.
        app.enable('trust proxy')
        provider.proxy = true

        function setNoCache (req, res, next) {
            res.set('Pragma', 'no-cache')
            res.set('Cache-Control', 'no-cache, no-store')
            next()
        }

        app.get('/oidc/interaction/:uid', setNoCache, async (req, res, next) => {
            /*
                This code is based on: https://github.com/panva/node-oidc-provider/blob/main/example/routes/express.js

                Important notes about interactionResult from: https://github.com/panva/node-oidc-provider

                // result should be an object with some or all the following properties
                {
                  // authentication/login prompt got resolved, omit if no authentication happened, i.e. the user
                  // cancelled
                  login: {
                    accountId: '7ff1d19a-d3fd-4863-978e-8cce75fa880c', // logged-in account id
                    acr: string, // acr value for the authentication
                    remember: boolean, // true if provider should use a persistent cookie rather than a session one, defaults to true
                    ts: number, // unix timestamp of the authentication, defaults to now()
                  },

                  // consent was given by the user to the client for this session
                  consent: {
                    grantId: string, // the identifer of Grant object you saved during the interaction, resolved by Grant.prototype.save()
                  },

                  ['custom prompt name resolved']: {},
                }

                // optionally, interactions can be primaturely exited with a an error by providing a result
                // object as follow:
                {
                  // an error field used as error code indicating a failure during the interaction
                  error: 'access_denied',

                  // an optional description for this error
                  error_description: 'Insufficient permissions: scope out of reach for this Account',
                }

            */

            // TODO(pahaz): we need to think about claims

            try {
                let interactionDetails = await provider.interactionDetails(req, res)

                if (!req.user) {
                    res.redirect(`/auth/signin?next=${req.url}`)
                    return
                }

                const accountId = req.user.id
                const clientId = interactionDetails.params.client_id

                const grant = new provider.Grant({
                    accountId,
                    clientId,
                })
                grant.addOIDCScope('openid')
                const grantId = await grant.save()

                const result = {
                    login: {
                        accountId,
                    },
                    consent: {
                        grantId,
                    },
                }

                const { prompt: { details } } = interactionDetails
                if (details.missingOIDCScope) {
                    logger.warn({
                        message: 'OIDCInteraction->addOIDCScope()',
                        missingOIDCScope: details.missingOIDCScope,
                    })
                    grant.addOIDCScope(details.missingOIDCScope.join(' '))
                }
                if (details.missingOIDCClaims) {
                    logger.warn({
                        message: 'OIDCInteraction->addOIDCClaims()',
                        missingOIDCClaims: details.missingOIDCClaims,
                    })
                    grant.addOIDCClaims(details.missingOIDCClaims)
                }
                if (details.missingResourceScopes) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
                        logger.warn({
                            message: 'OIDCInteraction->addResourceScope()',
                            indicator, scopes,
                        })

                        grant.addResourceScope(indicator, scopes.join(' '))
                    }
                }

                logger.info({ interactionDetails: result })
                await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
            } catch (err) {
                logger.error({
                    message: 'ERROR<-OIDCInteraction',
                    error: safeFormatError(err),
                })
                return res.status(400).json({
                    error: 'invalid_request',
                    error_description: err.toString(),
                })
            }
        })
        app.use('/oidc', provider.callback())
        return app
    }
}

module.exports = {
    OIDCMiddleware,
}
