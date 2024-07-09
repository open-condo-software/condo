const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { Contact } = require('@condo/domains/contact/utils/serverSchema')

const CONTACT_LIST = [
    '+79165609561',
    '+79857604331',
    '+79264487300',
    '+79096469477',
    '+79654230130',
    '+79096902571',
    '+79162959865',
    '+79150272525',
    '+79263271224',
    '+79100841145',
    '+79169324247',
    '+79639619371',
    '+79851644499',
    '+79037210291',
    '+79165958627',
    '+79852173266',
    '+79265775821',
    '+79166756595',
    '+79252598488',
    '+79161088264',
    '+79165063767',
    '+79039612481',
    '+79267270261',
    '+79258398887',
    '+79854174427',
    '+79057461349',
    '+79689320877',
    '+79265224133',
    '+79852442733',
    '+79264029815',
    '+79162917766',
    '+79031110728',
    '+79262218708',
    '+79777642196',
    '+79165890560',
    '+79166408877',
    '+79152007555',
    '+79160590795',
    '+79057316129',
    '+79853017905',
    '+79161268054',
    '+79168045707',
    '+79629245479',
    '+79671875388',
    '+79166562821',
    '+79629021110',
    '+79163116282',
    '+79857629614',
    '+79265923756',
    '+79151250669',
    '+79104897647',
]

const DV = 1
const SENDER = { dv: DV, fingerprint: 'update-contact-is-verified' }

class ContactUpdater {
    async connect () {
        console.info('[INFO] Connecting to database...')
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async updateContacts () {
        const where = {
            organization: { id: '3c296c0c-530c-455d-a6ad-69aca3317bfe' },
            deletedAt: null,
            isVerified: false,
            phone_in: CONTACT_LIST,
        }

        const contacts = await Contact.getAll(this.context, where)
        console.log(`Total count before update => ${contacts.length}`)
        let updatedCount = 0
        for (const contact of contacts) {
            await Contact.update(this.context, contact.id, {
                dv: 1, sender: SENDER, isVerified: true,
            })
            updatedCount += 1
            console.log('contact updated => ', JSON.stringify(contact))
        }

        console.log('total updated => ', updatedCount)
    }
}

const updateContacts = async () => {
    const contactUpdater = new ContactUpdater()
    console.time('keystone')
    await contactUpdater.connect()
    console.timeEnd('keystone')
    await contactUpdater.updateContacts()
}

updateContacts().then(() => {
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
})
