const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { find } = require('@open-condo/keystone/schema')
const { findOrganizationsForAddress } = require('@condo/domains/resident/utils/serverSchema')


let wasCalled = false
const someThing = async () => {
    if (wasCalled) return
    wasCalled = true

    const { distDir, keystone, apps } = require(path.resolve('./index.js'))
    await keystone.prepare({ apps: [apps[apps.findIndex(app => app instanceof GraphQLApp)]], distDir, dev: true })
    await keystone.connect()

    const data = {
        addressKey: '8eba0133-faae-4818-bed6-fe6c8775cdf7',
        //unitName: '159',
        //unitType: 'flat',
        //tin: '1841023336',
        //accountNumber: '0264182000',
    }

    return await findOrganizationsForAddress(keystone, data)

}

someThing().then(result => {
    console.log('result', result)
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})