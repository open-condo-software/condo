const { faker  } = require('@faker-js/faker/locale/ru')
const dayjs = require('dayjs')

const { makeLoggedInAdminClient, makeClient} = require('@open-condo/keystone/test.utils')
const { registerBillingReceiptsByTestClient } = require('@condo/domains/billing/utils/testSchema')
const {
    createTestBillingIntegration,
    createTestBillingIntegrationOrganizationContext,
    generateServicesData,
    createTestBillingIntegrationAccessRight,
} = require('@condo/domains/billing/utils/testSchema')
const { makeClientWithServiceUser, makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')

const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const {
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee
} = require("@condo/domains/organization/utils/testSchema");
const { makeClientWithNewRegisteredAndLoggedInUser, makeLoggedInClient } = require("../../../user/utils/testSchema");

class BillingTestUtils {

    clients = {
        anonymous: null,
        user: null,
        employee: null,
        support: null,
        service: null,
        admin: null,
    }

    billingCategoryIds = {
        HOUSING: '928c97ef-5289-4daa-b80e-4b9fed50c629',
        REPAIR: 'c0b9db6a-c351-4bf4-aa35-8e5a500d0195',
    }

    organization = null
    billingIntegration = null
    billingContext = null

    async init () {
        this.clients.admin = await makeLoggedInAdminClient()
        const [organization] = await createTestOrganization(this.clients.admin)
        this.organization = organization
        const [billingIntegration] = await createTestBillingIntegration(this.clients.admin)
        this.billingIntegration = billingIntegration
        const [billingContext] = await createTestBillingIntegrationOrganizationContext(this.clients.admin, organization, billingIntegration)
        this.billingContext = billingContext
        this.clients.service = await makeClientWithServiceUser()
        await createTestBillingIntegrationAccessRight(this.clients.admin, billingIntegration, this.clients.service.user)
        const roleArgs = { canManageIntegrations: true, canReadBillingReceipts: true, canReadPayments: true }
        const [role] = await createTestOrganizationEmployeeRole(this.clients.admin, organization, roleArgs)
        this.clients.employee = await makeClientWithNewRegisteredAndLoggedInUser()
        await createTestOrganizationEmployee(this.clients.admin, organization, this.clients.employee.user, role)
        this.clients.support = await makeClientWithSupportUser()
        this.clients.anonymous = await makeClient()
        this.clients.user = await makeLoggedInClient()
    }

    randomNumber (numDigits) {
        const min = 10 ** (numDigits - 1)
        const max = 10 ** numDigits - 1
        return faker.datatype.number({ min, max })
    }

    createValidELS () {
        return `${this.randomNumber(2)}БГ${this.randomNumber(6)}`
    }

    createRecipient (extra = {}) {
        return {
            tin: faker.random.numeric(8),
            routingNumber: faker.random.numeric(5),
            bankAccount: faker.random.numeric(12),
            ...extra,
        }
    }

    createAddressWithUnit () {
        return `${faker.address.cityName()} ${faker.address.streetAddress(true)}`
    }

    createJSONReceipt (extra = {}) {
        const [month, year] = dayjs().add(-1, 'month').format('MM-YYYY').split('-').map(Number)
        return Object.fromEntries(Object.entries({
            importId: faker.datatype.uuid(),
            address: this.createAddressWithUnit(),
            accountNumber: this.randomNumber(10).toString(),
            toPay: faker.finance.amount(-100, 5000),
            month,
            year,
            services: generateServicesData(faker.datatype.number({ min: 3, max: 5 })),
            ...this.createRecipient(),
            raw: extra,
            ...extra,
        }).filter(([, value]) => !!value))
    }

    async createReceipts (jsonReceipts) {
        if (!jsonReceipts) {
            jsonReceipts = [this.createJSONReceipt()]
        }
        return await registerBillingReceiptsByTestClient(this.clients.admin, {
            context: { id: this.billingContext.id },
            receipts: jsonReceipts,
        })
    }

}

module.exports = {
    BillingTestUtils,
}