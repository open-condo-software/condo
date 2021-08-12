const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const faker = require('faker')
const path = require('path')
const {
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
} = require('@condo/domains/billing/constants')

const DV = 1
const SENDER = { dv: DV, fingerprint: faker.random.alphaNumeric(8) }

const InProgressBilling = {
    dv: DV,
    sender: SENDER,
    name: 'ГИС ЖКХ',
    shortDescription: 'Государственная информационная система ЖКХ',
    detailsTitle: 'Подключение ГИС ЖКХ',
    detailsText: 'Вам нужно подать заявку на интеграцию через ваш личный кабинет в ГИС ЖКХ. Дальше, мы сделаем всё сами.\n' +
        'В результате, вы будете видеть все данные биллинга внутри платформы «Домá».',
    detailsConfirmButtonText: 'Подать заявку на интеграцию с ГИС ЖКХ',
    detailsInstructionButtonText: 'Инструкция на сайте биллинга',
    detailsInstructionButtonLink: 'https://dom.gosuslugi.ru',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
}

const SuccessfulBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Загрузка собственного реестра',
    shortDescription: 'Шаблон СБ Бизнес Онлайн 8_2',
    detailsTitle: 'Подключение реестрового обмена',
    detailsText: 'Выбрав данный вариант интеграции, вам будет необходимо загрузить ваши реестры к нам самостоятельно',
    detailsConfirmButtonText: 'Подключить',
    detailsInstructionButtonText: 'Подробнее про шаблон',
    detailsInstructionButtonLink: 'https://www.sberbank.ru/ru/s_m_business/new_sbbol',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
}

const ErrorBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Загрузка собственного реестра',
    shortDescription: 'Шаблон СБ Бизнес Онлайн 9_1',
    detailsTitle: 'Подключение реестрового обмена',
    detailsText: 'Выбрав данный вариант интеграции, вам будет необходимо загрузить ваши реестры к нам самостоятельно',
    detailsConfirmButtonText: 'Подключить',
    detailsInstructionButtonText: 'Подробнее про шаблон',
    detailsInstructionButtonLink: 'https://www.sberbank.ru/ru/s_m_business/new_sbbol',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
}

class BillingsGenerator {
    context = null

    async connect () {
        console.info('[INFO] Connecting to database...')
        const resolved = path.resolve('./index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async generateBillings () {
        console.info('[INFO] Generating billings...')
        await BillingIntegration.create(this.context, InProgressBilling)
        await BillingIntegration.create(this.context, SuccessfulBilling)
        await BillingIntegration.create(this.context, ErrorBilling)
    }


}

const createBillings = async () => {
    const BillingsManager = new BillingsGenerator()
    console.time('keystone')
    await BillingsManager.connect()
    console.timeEnd('keystone')
    await BillingsManager.generateBillings()
}

if (process.env.NODE_ENV !== 'development') {
    console.log('NODE_ENV needs to be set to "development"')
    process.exit(1)
}

createBillings()
    .then(() => {
        console.log('\r\n')
        console.log('All done')
        process.exit(0)
    }).catch((err) => {
        console.error('Failed to done', err)
    })