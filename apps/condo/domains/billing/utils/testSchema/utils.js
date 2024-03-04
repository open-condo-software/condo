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
const {
    makeClientWithServiceUser,
    makeClientWithSupportUser,
    makeClientWithNewRegisteredAndLoggedInUser,
    makeLoggedInClient,
} = require('@condo/domains/user/utils/testSchema')
const {
    createTestOrganization,
    createTestOrganizationEmployeeRole,
    createTestOrganizationEmployee,
} = require('@condo/domains/organization/utils/testSchema')


class BillingTestUtils {

    async init () {
        this.clients = {
            anonymous: await makeClient(),
            user: await makeLoggedInClient(),
            employee: await makeClientWithNewRegisteredAndLoggedInUser(),
            support: await makeClientWithSupportUser(),
            service: await makeClientWithServiceUser(),
            admin: await makeLoggedInAdminClient(),
        }
        const [organization] = await createTestOrganization(this.clients.admin)
        const [billingIntegration] = await createTestBillingIntegration(this.clients.admin)
        const [billingContext] = await createTestBillingIntegrationOrganizationContext(this.clients.admin, organization, billingIntegration)
        const [role] = await createTestOrganizationEmployeeRole(this.clients.admin, organization, {
            canManageIntegrations: true,
            canReadBillingReceipts: true,
            canReadPayments: true,
        })
        await createTestBillingIntegrationAccessRight(this.clients.admin, billingIntegration, this.clients.service.user)
        await createTestOrganizationEmployee(this.clients.admin, organization, this.clients.employee.user, role)
        this.organization = organization
        this.billingIntegration = billingIntegration
        this.billingContext = billingContext
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

    createPropertyAddress () {
        return `${faker.address.cityName()} ${faker.address.streetAddress(false)}`
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