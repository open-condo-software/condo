const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { isEmpty } = require('lodash')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

class ChangeOrganizationInn {
    constructor (org_id, new_inn) {
        this.org_id = org_id
        this.new_inn = new_inn
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

    async changeOrganizationInn () {
        console.info(`[INFO] Following organization tin will be changed: [${this.org_id}]`)

        await Organization.update(this.context, this.org_id, {
            country: 'ru',
            tin: this.new_inn,
            dv: 1,
            sender: { dv: 1, fingerprint: 'fixOrganizationInnScript' },
        })

        console.info('[INFO] tin has been changed...')
    }
}

const deleteMetersScript = async (org_id, new_inn) => {
    if (isEmpty(org_id)) {
        throw new Error('org_id not found!')
    }
    if (isEmpty(new_inn)) {
        throw new Error('new_inn not found!')
    }
    const changer = new ChangeOrganizationInn(org_id, new_inn)
    console.info('[INFO] Connecting to database...')
    await changer.connect()
    await changer.changeOrganizationInn()
}

const [org_id, new_inn] = [process.argv[2], process.argv[3]]

deleteMetersScript(org_id, new_inn).then(() => {
    console.log('\r\n')
    console.log('All done')
    process.exit(0)
}).catch((err) => {
    console.error('Failed to done', err)
    process.exit(0)
})
