const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const isEmpty = require('lodash/isEmpty')

const { find } = require('@open-condo/keystone/schema')

const { Contact } = require('@condo/domains/contact/utils/serverSchema')

class DeleteContactsByOrganizationId{
    constructor (organizationIds) {
        this.organizationIds = organizationIds
        this.context = null
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async findContacts () {
        return await find('Contact', {
            deletedAt: null,
            organization: {
                id_in: this.organizationIds,
            },
        })
    }

    async deleteContacts () {
        const contacts = await this.findContacts()

        console.info(`[INFO] Following contacts will be deleted: [${contacts.map(contact => `'${contact.id}'`).join(', ')}]`)

        if (isEmpty(contacts)) return

        for (const contact of contacts) {
            await Contact.softDelete(this.context, contact.id, 'id', {
                dv: 1,
                sender: { dv: 1, fingerprint: 'deleteIncorrectContactsScript' },
            })
        }

        console.info('[INFO] Contacts were soft-deleted.')
    }
}

const deleteContactsByOrganizationsIdsScript = async (organizationIds) => {
    if (isEmpty(organizationIds)) {
        throw new Error('Set organizations IDs! `script.js orgId1 orgId2 orgId3 ...')
    }
    const deleter = new DeleteContactsByOrganizationId(organizationIds)
    console.info('[INFO] Connecting to database...')
    await deleter.connect()
    await deleter.deleteContacts()
}

const organizationIds = process.argv.slice(2) // .slice(2) because first two arguments are nodePath and appPath

deleteContactsByOrganizationsIdsScript(organizationIds).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
    process.exit(1)
})
