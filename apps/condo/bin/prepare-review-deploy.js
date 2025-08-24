const path = require('path')

const { escapeRegExp } = require('lodash')

const conf = require('@open-condo/config')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')
const { OidcClient } = require('@condo/domains/user/utils/serverSchema')


let REVIEW_PREFIX = ''
let CONTEXT

async function getContext () {
    if (CONTEXT) return CONTEXT

    const { keystone: keystoneContext } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })
    CONTEXT = keystoneContext
    return CONTEXT
}

// https://review-custom-name-***.*** -> "review-custom-name-"
function getReviewPrefix ({ baseDomainTo }) {
    const condoDomain = conf['CONDO_DOMAIN']
    // controlled baseDomainTo
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const findPrefixRegex = new RegExp(`https://(review-[a-zA-Z0-9-]+?-)\\w+\\.${escapeRegExp(baseDomainTo)}`)
    const match = condoDomain.match(findPrefixRegex)
    return match?.[1] || ''
}

/**
 * Tries to change base domain in the url.
 * If this is not the url of the expected stand, it will return the original string
 *
 * @param {string} value
 * @param {string} baseDomainFrom
 * @param {string} baseDomainTo
 * @return {string}
 */
function tryChangeUrl (value, { baseDomainFrom, baseDomainTo }) {
    // controlled baseDomainFrom
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const expectedAppsUrlRegex = new RegExp(`https://([a-zA-Z0-9-]+)\\.${escapeRegExp(baseDomainFrom)}(\\/[^\\s]*)?`, 'g')

    return value.replace(expectedAppsUrlRegex, (match, subdomain, path = '') => {
        return `https://${REVIEW_PREFIX}${subdomain}.${baseDomainTo}${path}`
    })
}

function updateOidcConfigUrls (obj, { baseDomainFrom, baseDomainTo }) {
    function traverse (current) {
        if (typeof current === 'string') {
            return tryChangeUrl(current, { baseDomainFrom, baseDomainTo })
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
 * Changes all urls in oidcClient.payload from baseDomainFrom to baseDomainTo with prefix
 * @return {Promise<void>}
 */
async function migrateOidcClientUrls ({ baseDomainFrom, baseDomainTo }) {
    if (!REVIEW_PREFIX) throw new Error('Don\'t have review prefix!')

    const context = await getContext()

    const oidcClients = await OidcClient.getAll(context, {
        deletedAt: null,
    }, 'id clientId payload dv sender { dv fingerprint }')

    const updatedOidcClients = oidcClients.map((client) => {
        return {
            ...client,
            payload: updateOidcConfigUrls(client.payload, { baseDomainFrom, baseDomainTo }),
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
 * Changes all urls in B2BApp.appUrl from baseDomainFrom to baseDomainTo with prefix
 * @return {Promise<void>}
 */
async function migrateB2BAppUrls ({ baseDomainFrom, baseDomainTo }) {
    const context = await getContext()

    const b2bApps = await B2BApp.getAll(context, {
        deletedAt: null,
        appUrl_contains: baseDomainFrom,
    }, 'id appUrl dv sender { dv fingerprint }')

    const updatedB2BApps = b2bApps.map((b2bApp) => {
        return {
            ...b2bApp,
            appUrl: tryChangeUrl(b2bApp.appUrl, { baseDomainFrom, baseDomainTo }),
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
    const [baseDomainFrom, baseDomainTo] = args
    if (!baseDomainFrom || !baseDomainTo) throw new Error('No baseDomainFrom or baseDomainTo!')

    REVIEW_PREFIX = getReviewPrefix({ baseDomainTo })

    await migrateOidcClientUrls({ baseDomainFrom, baseDomainTo })

    await migrateB2BAppUrls({ baseDomainFrom, baseDomainTo })
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
