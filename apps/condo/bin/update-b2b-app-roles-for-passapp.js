const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const chunk = require('lodash/chunk')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const isString = require('lodash/isString')

const { find } = require('@open-condo/keystone/schema')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

class UpdateB2BAppRoles {
    constructor (b2bAppId) {
        this.b2bAppId = b2bAppId
        this.context = null
        this.chunkSize = 50
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async findRoles () {
        return await find('B2BAppRole', {
            deletedAt: null,
            app: { id: this.b2bAppId },
        })
    }

    async updateRoles () {
        const roles = await this.findRoles()

        console.info(`[INFO] Following roles will be updated (founded ${roles.length}): [${roles.map(role => `'${role.id}'`).join(', ')}]`)

        if (isEmpty(roles)) {
            console.log('Have not roles!')
            return
        }

        const payload = roles.map(role => ({
            id: role.id,
            data: {
                permissions: { ...role.permissions, canManagePassTicketStatusField: get(role, 'permissions.canManagePasses', false) },
                dv: 1,
                sender: { dv: 1, fingerprint: 'update-b2b-app-roles-script' },
            },
        }))

        const totalRoles = payload.length
        
        let updatedItems = 0
        const chunks = chunk(payload, this.chunkSize)

        for (const chunkData of chunks) {
            const updated = await B2BAppRole.updateMany(this.context, chunkData)
            updatedItems += updated.length
            console.info(`${updatedItems}/${totalRoles} roles updated`)
        }

        console.info('[INFO] B2BAppRoles were updated.')
    }
}

const updateB2bAppRolesScript = async (b2bAppId) => {
    if (!isString(b2bAppId)) {
        throw new Error('Set b2bAppId! `script.js b2bAppId`')
    }
    const updater = new UpdateB2BAppRoles(b2bAppId)
    console.info('[INFO] Connecting to database...')
    await updater.connect()
    await updater.updateRoles()
}

const [b2bAppId] = process.argv.slice(2) // .slice(2) because first two arguments are nodePath and appPath

updateB2bAppRolesScript(b2bAppId).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
    process.exit(1)
})
