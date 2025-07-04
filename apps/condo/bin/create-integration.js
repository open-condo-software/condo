const path = require('path')

const { faker } = require('@faker-js/faker')
const { GraphQLApp } = require('@open-keystone/app-graphql')

const {
    BillingIntegration,
    BillingCurrency,
    BillingIntegrationAccessRight,
} = require('@condo/domains/billing/utils/serverSchema')
const { User } = require('@condo/domains/user/utils/serverSchema')


class IntegrationControl {

    sender = {
        dv: 1,
        sender: {
            dv: 1,
            fingerprint: 'create-integration',
        },
    }

    constructor (integrationDetails) {
        this.details = integrationDetails
    }

    async connect () {
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async createIntegration () {
        const [existedIntegration] = await BillingIntegration.getAll(this.context, { name: this.details.name } )
        if (existedIntegration) {
            throw new Error(`Integration with name ${this.details.name} already existed`)
        }
        const [currency] = await BillingCurrency.getAll(this.context, { code: 'RUB' })
        const integrationDetails = { ...this.sender, ...this.details }
        if (currency) {
            integrationDetails.currency = { connect: { id: currency.id } }
        }
        const userCredentials = {
            phone: faker.phone.number('+79#########'),
            password: faker.internet.password(),
        }
        const user = await User.create(this.context, {
            ...this.sender,
            ...userCredentials,
        })
        const integration = await BillingIntegration.create(this.context, integrationDetails)
        const access = await BillingIntegrationAccessRight.create(this.context, {
            ...this.sender,
            integration: {
                connect: { id: integration.id },
            },
            user: {
                connect: { id: user.id },
            },
        })
        console.log('userCredentials', userCredentials)
    }



}

const registerIntegration = async ( integrationParams ) => {
    const Integration = new IntegrationControl(integrationParams)
    await Integration.connect()
    await Integration.createIntegration()
}

registerIntegration({
    name: 'ЕПС',
    shortDescription: 'Единая платежная сиситема',
    detailsTitle: 'Подключение ЕПС',
    detailsText: 'Вам ничего не нужно делать интеграция сама заработает. В результате, вы будете видеть все данные биллинга внутри платформы «Дома́»',
    detailsConfirmButtonText: 'Заявку на интеграцию с ЕПС подавать не нужно',
    detailsInstructionButtonText: 'Инструкция по интеграции (в разработке)',
    detailsInstructionButtonLink: 'https://help.doma.ai/article/todo',
    billingPageTitle: 'Биллинг ЕПС',
}).then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
