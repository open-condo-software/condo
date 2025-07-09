const path = require('path')

const { escapeRegExp } = require('lodash')

const conf = require('@open-condo/config')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

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

let REVIEW_PREFIX = ''
function updateUrls (obj, { devBaseDomain, reviewBaseDomain }) {
    // controlled devBaseDomain
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const devAppsUrlRegex = new RegExp(`https://([a-zA-Z0-9-]+)\\.${escapeRegExp(devBaseDomain)}(\\/[^\\s]*)?`, 'g')

    function traverse (current) {
        if (typeof current === 'string') {
            return current.replace(devAppsUrlRegex, (match, subdomain, path = '') => {
                return `https://${REVIEW_PREFIX}${subdomain}.${reviewBaseDomain}${path}`
            })
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
            payload: updateUrls(client.payload, { devBaseDomain, reviewBaseDomain }),
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


async function main (args) {
    const [devBaseDomain, reviewBaseDomain] = args
    if (!devBaseDomain || !reviewBaseDomain) throw new Error('No devBaseDomain or reviewBaseDomain!')

    REVIEW_PREFIX = getReviewPrefix({ reviewBaseDomain })

    await migrateOidcClientUrlsToReview({ devBaseDomain, reviewBaseDomain })
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
