const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { Organization, registerOrganization } = require('@condo/domains/organization/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [name, organizationOptions] = args
    if (!name) throw new Error('use: create-organization <name> [<options>]')
    const parsedOptions = getJson(organizationOptions)
    if (organizationOptions && !parsedOptions) throw new Error('<options> argument should be a valid json object')

    const orgPayload = parsedOptions || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    console.info(`ORGANIZATION NAME: ${name}`)
    const existingOrganization = await Organization.getOne(context, { name })
    orgPayload.dv ??= 1
    orgPayload.sender ??= { 'dv': 1, 'fingerprint': 'create-organization-script' }
    orgPayload.country ??= 'ru'
    orgPayload.type ??= 'MANAGING_COMPANY'
    orgPayload.tin ??= '0000000000'
    orgPayload.meta ??= { dv: 1 }

    if (!existingOrganization) {
        const organization = await registerOrganization(context, {
            name,
            ...orgPayload,
        })
        console.info('Organization created!')
        console.info(`ORGANIZATION ID: ${organization.id}`)
        return organization.id
    } else {
        console.info('Organization already exists!')
        console.info(`ORGANIZATION ID: ${existingOrganization.id}`)
        return existingOrganization.id
    }
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
