const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { createDefaultB2BAppRoles } = require('@condo/domains/miniapp/tasks')

async function main () {
    console.log('Preparing Keystone')
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const activeContexts = await find('B2BAppContext', {
        deletedAt: null,
        status: CONTEXT_FINISHED_STATUS,
    })

    console.log(`Found ${activeContexts.length} to migrate`)
    let processed = 0
    for (const b2bContext of activeContexts) {
        const orgId = get(b2bContext, 'organization')
        const appId = get(b2bContext, 'app')
        if (!orgId || !appId) {
            console.log(`[${processed + 1}/${activeContexts.length}] No org or app. Context ${b2bContext.id} is skipped`)
            processed++
            continue
        }
        console.log(`[${processed + 1}/${activeContexts.length}] Processing...Organization: ${orgId}, App: ${appId}`)
        await createDefaultB2BAppRoles.applyAsync([appId, orgId])
        processed++
        console.log(`[${processed}/${activeContexts.length}] Processed...Organization: ${orgId}, App: ${appId}`)
    }
}

main().then(() => {
    console.log('ALL DONE!')
    process.exit()
}).catch((err) => {
    console.error('Failed to done', err)
})