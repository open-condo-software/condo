const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

const conf = require('@open-condo/config')

const { OidcClient } = require('@condo/domains/user/utils/serverSchema')


let context
async function getContext () {
    if (context) return context

    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()
    context = await keystone.createContext({ skipAccessControl: true })

    return context
}

// https://review-custom-name-***.*** -> "review-custom-name-"
function getReviewPrefix ({ reviewDomain }) {
    const condoDomain = conf['CONDO_DOMAIN']
    const findPrefixRegex = new RegExp(`https://(review-[a-zA-Z0-9-]+?-)\\w+\\.${reviewDomain.replaceAll('.', '\\.')}`)
    const match = condoDomain.match(findPrefixRegex)
    return match?.[1] || ''
}

let REVIEW_PREFIX = ''
function updateUrls (obj, { devDomain, reviewDomain }) {
    const urlRegex = new RegExp(`https://([a-zA-Z0-9-]+)\\.${devDomain.replaceAll('.', '\\.')}(\\/[^\\s]*)?`, 'g')

    function traverse (current) {
        if (typeof current === 'string') {
            return current.replace(urlRegex, (match, subdomain, path = '') => {
                return `https://${REVIEW_PREFIX}${subdomain}.${reviewDomain}${path}`
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
 * Changes all urls in oidcClient.payload from devDomain to reviewDomain with prefix
 * @return {Promise<void>}
 */
async function replaceOidcClients ({ devDomain, reviewDomain }) {
    if (!REVIEW_PREFIX) throw new Error('Don\'t have review prefix!')

    const context = await getContext()

    const oidcClients = await OidcClient.getAll(context, {
        deletedAt: null,
    }, 'id clientId payload dv sender { dv fingerprint }')

    const updatedOidcClients = oidcClients.map((client) => {
        return {
            ...client,
            payload: updateUrls(client.payload, { devDomain, reviewDomain }),
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
    const [devDomain, reviewDomain] = args

    REVIEW_PREFIX = getReviewPrefix({ reviewDomain })

    await replaceOidcClients({ devDomain, reviewDomain })
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
