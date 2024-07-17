const path = require('path')

const { GraphQLApp } = require('@keystonejs/app-graphql')

const { registerPaymentRule } = require('@condo/domains/acquiring/utils/serverSchema')


let wasCalled = false
const someThing = async () => {
    if (wasCalled) return
    wasCalled = true

    const { distDir, keystone, apps } = require(path.resolve('./index.js'))
    await keystone.prepare({ apps: [apps[apps.findIndex(app => app instanceof GraphQLApp)]], distDir, dev: true })
    await keystone.connect()

    /*const requisites = [
        { bankAccount: { tin: '9717025407', routingNumber: '044525225', number: '40702810838000015798' }, marketPlaceScope: { address: 'г Москва, ул Маломосковская, д 14' } },
        { bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810701100008293' }, marketPlaceScope: { address: 'г Москва, ул Новоалексеевская, д 22 к 1' } },
        { bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810701100008293' }, marketPlaceScope: { address: 'г Москва, ул Новоалексеевская, д 22 к 2' } },
        { bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810501100016896' }, marketPlaceScope: { address: 'г Москва, Звонарский пер, д 3' } },
        //{ bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810501100016896' }, billingScope: { category: { connect: { id: '928c97ef-5289-4daa-b80e-4b9fed50c629' } } } },
    ]*/
    const requisites = [
        { bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810701100008293' }, marketPlaceScope: { property: { connect: { id: '32699913-6a83-4ad7-9277-f4bf79d0eb18' } } } },
        { bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810701100008293' }, marketPlaceScope: { property: { connect: { id: '378cfeef-13df-43dc-b02d-a03e82035e95' } } } },
        //{ bankAccount: { tin: '9717025407', routingNumber: '044525593', number: '40702810501100016896' }, billingScope: { category: { connect: { id: '928c97ef-5289-4daa-b80e-4b9fed50c629' } } } },
    ]

    const rules = []
    for (const requisite of requisites) {
        rules.push(await registerPaymentRule(keystone, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'register-rule-script' },
            acquiringIntegrationContext: { id: 'b26a4f1c-0d8f-435c-8450-0f4fc7683e7e' },
            fee: { implicitFee: '0.5', explicitServiceCharge: '0.5' },
            ...requisite,
        }))
    }

    return rules

}

someThing().then(result => {
    console.log('result', result)
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})