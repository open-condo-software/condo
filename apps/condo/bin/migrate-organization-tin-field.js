/**
 * Load valid inn values from organization.meta.inn to organization.tin
 *
 * Usage:
 *      yarn workspace @app/condo node bin/migrate-organization-tin-field
 */

const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { migrateOrganizationTinField } = require('@condo/domains/organization/tasks/migrateOrganizationTinField')


async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    await migrateOrganizationTinField()
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
