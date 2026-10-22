const fs = require('fs')
const path = require('path')


const { faker } = require('@faker-js/faker')
const { program } = require('commander')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { uploadFilesFromServer } = require('@open-condo/files/server')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { find } = require('@open-condo/keystone/schema')

const { B2CApp, B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')
const { CONDO_SUPPORTED_RESPONSE_TYPES } = require('@condo/domains/user/constants/oidc')
const { OidcClient, User } = require('@condo/domains/user/utils/serverSchema')

const FILE_CLIENT_ID = conf['FILE_CLIENT_ID']
const ADMIN_EMAIL = conf['DEFAULT_TEST_ADMIN_IDENTITY']
const APP_SCHEMA = z.object({
    name: z.string(),
}).catchall(z.unknown())
const OIDC_SCHEMA = z.record(z.string(), z.unknown())
const DEFAULT_OIDC_PAYLOAD = {
    grant_types: ['authorization_code'],
    response_types: CONDO_SUPPORTED_RESPONSE_TYPES,
    token_endpoint_auth_method: 'client_secret_basic',
    // NOTE: to allow OIDC working on localhost without https
    application_type: 'native',
    redirect_uris: ['http://localhost:3000'],
}
const DEFAULT_APP_PAYLOAD = {
    appUrl: 'http://localhost:3000',
    isDomainsMappingEnabled: false,
}

const parsedProgram = program
    .description('Create a new miniapp, linking it with OIDC client in single pass, if type not specified both B2B and B2C apps will be created')
    .helpOption('-h, --help', 'Display help for command')
    .requiredOption('-a, --app <options>', 'Miniapp options')
    .option('-t, --type <type>', 'Miniapp type')
    .option('-o, --oidc <options>', 'OIDC payload options')
    .parse(process.argv)


async function main () {
    const { app, type, oidc } = parsedProgram.opts()
    const appOptions = APP_SCHEMA.parse(JSON.parse(app))
    const oidcOptions = OIDC_SCHEMA.parse(JSON.parse(oidc ?? '{}'))

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const [existingClient] = await find('OidcClient', {
        deletedAt: null,
        clientId: appOptions.name,
    })

    let clientSecret = oidcOptions.client_secret
    let oidcClientId = existingClient?.id

    if (existingClient) {
        if (!clientSecret) {
            clientSecret = existingClient.payload.client_secret
        }

        if (Object.keys(oidcOptions).length > 0) {
            await OidcClient.update(context, existingClient.id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'bin-create-miniapp' },
                ...oidcOptions,
            })
        }
    } else if (!existingClient) {
        if (!clientSecret) {
            clientSecret = faker.random.alphaNumeric(32)
        }

        const payload = {
            ...DEFAULT_OIDC_PAYLOAD,
            ...oidcOptions,
            client_secret: clientSecret,
            client_id: appOptions.name,
        }
        const newClient = await OidcClient.create(context, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'bin-create-miniapp' },
            clientId: appOptions.name,
            name: appOptions.name,
            isEnabled: true,
            canAuthorizeSuperUsers: true,
            payload,
        })
        oidcClientId = newClient.id
    }

    const appModels = []
    if (!type || type === 'B2B') {
        appModels.push({ modelGql: B2BApp, schemaName: 'B2BApp' })
    }
    if (!type || type === 'B2C') {
        appModels.push({ modelGql: B2CApp, schemaName: 'B2CApp', extraFields: { colorSchema: { main: '#000', secondary: '#fff' } } })
    }

    for (const { modelGql, schemaName, extraFields } of appModels) {
        const [existingApp] = await modelGql.getAll(context, {
            deletedAt: null,
            name: appOptions.name,
        }, 'id oidcClient { id }', { first: 1 })
        if (existingApp && (existingApp?.oidcClient?.id !== oidcClientId || Object.keys(appOptions).length > 1)) {
            await modelGql.update(context, existingApp.id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'bin-create-miniapp' },
                oidcClient: { connect: { id: oidcClientId } },
                ...appOptions,
            })
        } else if (!existingApp) {
            const adminUser = await User.getOne(context, {
                deletedAt: null,
                email: ADMIN_EMAIL,
                isAdmin: true,
            })
            if (!adminUser) {
                throw new Error('User required to upload file not found')
            }
            const stream = fs.createReadStream(path.resolve('domains/common/test-assets/dino.png'))
            const [logo] = await uploadFilesFromServer({
                skipAccessControl: true,
                fileClientId: FILE_CLIENT_ID,
                userId: adminUser.id,
                fingerprint: 'bin-create-miniapp',
                modelNames: [schemaName],
                files: [{
                    stream,
                    filename: 'logo.png',
                    mimetype: 'image/png',
                }],
            })
            await modelGql.create(context, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'bin-create-miniapp' },
                ...DEFAULT_APP_PAYLOAD,
                name: appOptions.name,
                logo,
                developer: 'open-condo-software',
                ...extraFields,
                ...appOptions,
                oidcClient: { connect: { id: oidcClientId } },
            })
        }
    }
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)