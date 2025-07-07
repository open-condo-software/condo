const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')

const { updateAppEnvFile } = require('@open-condo/cli')


const {
    AcquiringIntegration,
    AcquiringIntegrationAccessRight,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    BillingIntegration,
    BillingIntegrationAccessRight,
} = require('@condo/domains/billing/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')

async function connectToKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()
    return await keystone.createContext({ skipAccessControl: true })
}

function parseArgv () {
    const args = {}
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--auth-requisites=')) args.authRequisites = JSON.parse(arg.replace('--auth-requisites=', ''))
        if (arg.startsWith('--billing=')) args.billing = JSON.parse(arg.replace('--billing=', ''))
        if (arg.startsWith('--acquiring=')) args.acquiring = JSON.parse(arg.replace('--acquiring=', ''))
        if (arg.startsWith('--endpoint=')) args.endpoint = arg.replace('--endpoint=', '')
        if (arg.startsWith('--app-name=')) args.endpoint = arg.replace('--app-name=', '')
        if (arg.startsWith('--env-key=')) args.endpoint = arg.replace('--env-key=', '')
    })
    return args
}

async function main () {
    const args = parseArgv()
    const dvSender = { dv: 1, sender: { dv: 1, fingerprint: 'create-integration-user-script' } }
    const authReq = args.authRequisites
    const userOptions = { ...dvSender, type: 'service', password: authReq.password, name: authReq.email.split('@')[0] }
    const billingIntegrationDetails = args.billing
    const acquiringIntegrationDetails = args.acquiring
    const context = await connectToKeystone()
    //if user exists script should not override auth reqs
    let user = await User.getOne(context, { email: authReq.email })
    if (!user) {
        user = await User.create(context, { email: authReq.email, ...userOptions })
    }
    const userId = user.id

    let billingId = null
    if (billingIntegrationDetails && billingIntegrationDetails.name) {
        let billingIntegration = await BillingIntegration.getOne(context, { name: billingIntegrationDetails.name })
        billingId = billingIntegration?.id
        if (!billingIntegration) {
            const integrationDetails = { ...dvSender, ...billingIntegrationDetails }
            billingIntegration = await BillingIntegration.create(context, integrationDetails)
            billingId = billingIntegration.id
        }
        let billingAccess = await BillingIntegrationAccessRight.getOne(context, { integration: { id: billingIntegration.id }, user: { id: userId } })
        if (!billingAccess) {
            await BillingIntegrationAccessRight.create(context, {
                ...dvSender,
                integration: { connect: { id: billingIntegration.id } },
                user: { connect: { id: userId } },
            })
        }
    }

    let acquiringId = null
    if (acquiringIntegrationDetails && acquiringIntegrationDetails.name) {
        let acquiringIntegration = await AcquiringIntegration.getOne(context, { name: acquiringIntegrationDetails.name })
        acquiringId = acquiringIntegration?.id
        if (!acquiringIntegration) {
            const integrationDetails = { ...dvSender, ...acquiringIntegrationDetails }
            acquiringIntegration = await AcquiringIntegration.create(context, integrationDetails)
            acquiringId = acquiringIntegration.id
        }
        let acquiringAccess = await AcquiringIntegrationAccessRight.getOne(context, { integration: { id: acquiringIntegration.id }, user: { id: userId } })
        if (!acquiringAccess) {
            await AcquiringIntegrationAccessRight.create(context, {
                ...dvSender,
                integration: { connect: { id: acquiringIntegration.id } },
                user: { connect: { id: userId } },
            })
        }
    }

    await updateAppEnvFile('eps', 'EPS_INTEGRATION', JSON.stringify({
        endpoint: args.endpoint,
        authRequisites: args.authRequisites,
        billing: billingId,
        acquiring: acquiringId,
    }), { override: true })

    process.exit(0)
}

main().catch(e => {
    console.error(e)
    process.exit(1)
}) 