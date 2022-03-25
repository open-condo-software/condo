const { BillingIntegration } = require('@condo/domains/billing/utils/serverSchema')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const faker = require('faker')
const path = require('path')
const {
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
} = require('@condo/domains/billing/constants/constants')

const DV = 1
const SENDER = { dv: DV, fingerprint: faker.random.alphaNumeric(8) }
const RUB_CURRENCY_CODE = 'RUB'
const USD_CURRENCY_CODE = 'USD'
const DEVELOPER_NAME = 'DOMA'

const Lvl1DataFormat = {
    hasToPayDetails: false,
    hasServices: false,
    hasServicesDetails: false,
}

const Lvl1PlusDataFormat = {
    hasToPayDetails: true,
    hasServices: false,
    hasServicesDetails: false,
}

const Lvl2DataFormat = {
    hasToPayDetails: true,
    hasServices: true,
    hasServicesDetails: false,
}

const Lvl3DataFormat = {
    hasToPayDetails: true,
    hasServices: true,
    hasServicesDetails: true,
}

const InProgressBilling = {
    dv: DV,
    sender: SENDER,
    name: 'ГИС ЖКХ (IN PROGRESS STATUS)',
    shortDescription: 'Государственная информационная система ЖКХ',
    detailsTitle: 'Подключение ГИС ЖКХ',
    detailsText: 'Вам нужно подать заявку на интеграцию через ваш личный кабинет в ГИС ЖКХ. Дальше, мы сделаем всё сами.\n' +
        'В результате, вы будете видеть все данные биллинга внутри платформы «Домá».',
    detailsConfirmButtonText: 'Подать заявку на интеграцию с ГИС ЖКХ',
    detailsInstructionButtonText: 'Инструкция на сайте биллинга',
    detailsInstructionButtonLink: 'https://dom.gosuslugi.ru',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
    billingPageTitle: 'Биллинг ГИС ЖКХ',
    dataFormat: Lvl1DataFormat,
    developer: DEVELOPER_NAME,
}

const SuccessfulBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Интеграция через загрузку вашего реестра (DONE STATUS)',
    shortDescription: 'Поддерживаемые форматы: 1С, СБ Бизнес Онлайн 8_2 и 9_1',
    detailsTitle: 'Интеграция через загрузку реестров',
    detailsText: 'Выберите формат, в котором хотите загружать ваши реестры в Домá.\n' +
        'Мы запомним ваш выбор и в следующий раз не будем спрашивать про формат файлов.',
    detailsConfirmButtonText: 'Подключить',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг, реестровый обмен',
    dataFormat: Lvl3DataFormat,
    availableOptions: {
        title: 'Формат ваших реестров',
        options: [
            {
                name: '1C',
                displayName: '1C',
                billingPageTitle: 'Интеграция через загрузку реестров 1С',
                descriptionDetails: {
                    urlText: 'о формате',
                    url: 'https://help.doma.ai',
                },
            },
            {
                name: 'SBBOL_8_2',
                displayName: 'СБ Бизнес Онлайн 8_2',
                billingPageTitle: 'Интеграция через загрузку реестров СББОЛ',
                descriptionDetails: {
                    urlText: 'о формате',
                    url: 'https://help.doma.ai',
                },
                dataFormat: Lvl1DataFormat,
            },
            {
                name: 'SBBOL_9_1',
                displayName: 'СБ Бизнес Онлайн 9_1',
                billingPageTitle: 'Интеграция через загрузку реестров СББОЛ',
                descriptionDetails: {
                    urlText: 'о формате',
                    url: 'https://help.doma.ai',
                },
            },
        ],
    },
    developer: DEVELOPER_NAME,
}

const ErrorBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Error',
    shortDescription: 'Billing that will never be completed :)',
    detailsTitle: 'You won\'t do this',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
    dataFormat: Lvl1DataFormat,
    developer: DEVELOPER_NAME,
}

const NoDetailsBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Lvl 1',
    shortDescription: 'Рублевый биллинг без детализаций',
    detailsTitle: 'Подключение биллинга с детализацией 1',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг, уровень 1',
    dataFormat: Lvl1DataFormat,
    developer: DEVELOPER_NAME,
}

const NoDetailsDollarBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Lvl 1',
    shortDescription: 'Долларовый биллинг без детализаций',
    detailsTitle: 'Подключение биллинга с детализацией 1 и долларами',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг "Доллар", уровень 1',
    dataFormat: Lvl1DataFormat,
    developer: DEVELOPER_NAME,
}

const ToPayDetailsBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Lvl 1+',
    shortDescription: 'Рублевый биллинг с детализацией по оплате',
    detailsTitle: 'Подключение биллинга с детализацией 1+',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг, уровень 1+',
    dataFormat: Lvl1PlusDataFormat,
    developer: DEVELOPER_NAME,
}

const WithServicesBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Lvl 2',
    shortDescription: 'Рублевый биллинг с детализацией по оплате и услугами',
    detailsTitle: 'Подключение биллинга с детализацией 2',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг, уровень 2',
    dataFormat: Lvl2DataFormat,
    developer: DEVELOPER_NAME,
}

const WithServicesDetailsBilling = {
    dv: DV,
    sender: SENDER,
    name: 'Lvl 3',
    shortDescription: 'Рублевый биллинг с детализацией по оплате и услугам',
    detailsTitle: 'Подключение биллинга с детализацией 3',
    contextDefaultStatus: BILLING_INTEGRATION_ORGANIZATION_CONTEXT_FINISHED_STATUS,
    billingPageTitle: 'Биллинг, уровень 3',
    dataFormat: Lvl3DataFormat,
    developer: DEVELOPER_NAME,
}

const RUBLE_BILLINGS_TO_CREATE = [
    InProgressBilling,
    SuccessfulBilling,
    ErrorBilling,
    NoDetailsBilling,
    ToPayDetailsBilling,
    WithServicesBilling,
    WithServicesDetailsBilling,
]

const DOLLAR_BILLINGS_TO_CREATE = [
    NoDetailsDollarBilling,
]

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
        for (const billing of RUBLE_BILLINGS_TO_CREATE) {
            await BillingIntegration.create(this.context, {
                ...billing,
                currencyCode: RUB_CURRENCY_CODE,
            })
        }
        for (const billing of DOLLAR_BILLINGS_TO_CREATE) {
            await BillingIntegration.create(this.context, {
                ...billing,
                currencyCode: USD_CURRENCY_CODE,
            })
        }
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