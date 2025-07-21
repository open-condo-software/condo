const path = require('path')

const { escapeRegExp } = require('lodash')

const conf = require('@open-condo/config')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')
const { OidcClient } = require('@condo/domains/user/utils/serverSchema')


let context
async function getContext () {
    if (context) return context

    const { keystone: keystoneContext } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })
    context = keystoneContext
    return context
}

// https://review-custom-name-***.*** -> "review-custom-name-"
function getReviewPrefix ({ reviewBaseDomain }) {
    const condoDomain = conf['CONDO_DOMAIN']
    // controlled reviewBaseDomain
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const findPrefixRegex = new RegExp(`https://(review-[a-zA-Z0-9-]+?-)\\w+\\.${escapeRegExp(reviewBaseDomain)}`)
    const match = condoDomain.match(findPrefixRegex)
    return match?.[1] || ''
}

/**
 * Tries to change the url from the dev stand to the review stand.
 * If this is not the url of the dev stand, it will return the original string
 *
 * @param {string} value
 * @param {string} devBaseDomain
 * @param {string} reviewBaseDomain
 * @return {string}
 */
function tryChangeDevUrlToReviewUrl (value, { devBaseDomain, reviewBaseDomain }) {
    // controlled devBaseDomain
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const devAppsUrlRegex = new RegExp(`https://([a-zA-Z0-9-]+)\\.${escapeRegExp(devBaseDomain)}(\\/[^\\s]*)?`, 'g')

    return value.replace(devAppsUrlRegex, (match, subdomain, path = '') => {
        return `https://${REVIEW_PREFIX}${subdomain}.${reviewBaseDomain}${path}`
    })
}

let REVIEW_PREFIX = ''
function updateOidcConfigUrls (obj, { devBaseDomain, reviewBaseDomain }) {
    function traverse (current) {
        if (typeof current === 'string') {
            return tryChangeDevUrlToReviewUrl(current, { devBaseDomain, reviewBaseDomain })
        } else if (Array.isArray(current)) {
            return current.map(item => traverse(item))
        } else if (typeof current === 'object' && current !== null) {
            const result = {}
            for (const key in current) {
                result[key] = traverse(current[key])
            }
            return result
        } else {
            return current
        }
    }

    return traverse(obj)
}

/**
 * Changes all urls in oidcClient.payload from devBaseDomain to reviewBaseDomain with prefix
 * @return {Promise<void>}
 */
async function migrateOidcClientUrlsToReview ({ devBaseDomain, reviewBaseDomain }) {
    if (!REVIEW_PREFIX) throw new Error('Don\'t have review prefix!')

    const context = await getContext()

    const oidcClients = await OidcClient.getAll(context, {
        deletedAt: null,
    }, 'id clientId payload dv sender { dv fingerprint }')

    const updatedOidcClients = oidcClients.map((client) => {
        return {
            ...client,
            payload: updateOidcConfigUrls(client.payload, { devBaseDomain, reviewBaseDomain }),
        }
    })

    for (const oidcClient of updatedOidcClients) {
        try {
            await OidcClient.update(context, oidcClient.id, {
                payload: oidcClient.payload,
                dv: oidcClient.dv,
                sender: oidcClient.sender,
            })
        } catch (error) {
            console.error(error)
        }
    }
}

/**
 * Changes all urls in B2BApp.appUrl from devBaseDomain to reviewBaseDomain with prefix
 * @return {Promise<void>}
 */
async function migrateB2BAppUrlsToReview ({ devBaseDomain, reviewBaseDomain }) {
    const context = await getContext()

    const b2bApps = await B2BApp.getAll(context, {
        deletedAt: null,
        appUrl_contains: devBaseDomain,
    }, 'id appUrl dv sender { dv fingerprint }')

    const updatedB2BApps = b2bApps.map((b2bApp) => {
        return {
            ...b2bApp,
            appUrl: tryChangeDevUrlToReviewUrl(b2bApp.appUrl, { devBaseDomain, reviewBaseDomain }),
        }
    })

    for (const b2bApp of updatedB2BApps) {
        try {
            await B2BApp.update(context, b2bApp.id, {
                appUrl: b2bApp.appUrl,
                dv: b2bApp.dv,
                sender: b2bApp.sender,
            })
        } catch (error) {
            console.error(error)
        }
    }
}

async function main (args) {
    const [devBaseDomain, reviewBaseDomain] = args
    if (!devBaseDomain || !reviewBaseDomain) throw new Error('No devBaseDomain or reviewBaseDomain!')

    REVIEW_PREFIX = getReviewPrefix({ reviewBaseDomain })

    await migrateOidcClientUrlsToReview({ devBaseDomain, reviewBaseDomain })

    await migrateB2BAppUrlsToReview({ devBaseDomain, reviewBaseDomain })
}

main(process.argv.slice(2))
    .then(() => {
        console.log('Prepare review deploy done')
        process.exit()
    })
    .catch((error) => {
        console.error('Prepare review deploy error')
        console.error(error)
        process.exit(1)
    })
