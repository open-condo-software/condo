/**
 * Migrate User.importId/User.importRemoteSystem fields data to separate entity: UserExternalIdentity
 *
 * Usage:
 *      yarn workspace @app/condo node bin/migrate-user-import-id-data-to-user-external-identity
 */

const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { migrateUserImportIdDataToUserExternalIdentity } = require('@condo/domains/user/tasks/migrateUserImportIdDataToUserExternalIdentity')

async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    // start migration
    await migrateUserImportIdDataToUserExternalIdentity()

    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})