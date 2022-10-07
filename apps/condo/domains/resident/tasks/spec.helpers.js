const { getStartDates } = require('@condo/domains/common/utils/date')

const {
    createTestBillingIntegration,
    createTestBillingReceipt,
    createTestBillingIntegrationOrganizationContext,
    createTestBillingIntegrationAccessRight,
    createTestBillingProperty,
    createTestBillingAccount,
} = require('@condo/domains/billing/utils/testSchema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')

const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')

const { registerResidentByTestClient, registerServiceConsumerByTestClient } = require('@condo/domains/resident/utils/testSchema')

const { makeClientWithSupportUser, makeClientWithServiceUser, makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

const makeBillingReceiptWithResident = async (billingReceiptAttrs = {}, skipConsumer = false) => {
    const userClient = await makeClientWithProperty()
    const support = await makeClientWithSupportUser()
    const [integration] = await createTestBillingIntegration(support, { contextDefaultStatus: CONTEXT_FINISHED_STATUS })
    const [billingContext] = await createTestBillingIntegrationOrganizationContext(userClient, userClient.organization, integration)
    const integrationClient = await makeClientWithServiceUser()
    await createTestBillingIntegrationAccessRight(support, integration, integrationClient.user)
    const [billingProperty] = await createTestBillingProperty(integrationClient, billingContext, { address: userClient.property.address })
    const [billingAccount, billingAccountAttrs] = await createTestBillingAccount(integrationClient, billingContext, billingProperty)
    const residentUser = await makeClientWithResidentUser()
    const [resident] = await registerResidentByTestClient(residentUser, {
        address: userClient.property.address,
        addressMeta: userClient.property.addressMeta,
        unitName: billingAccountAttrs.unitName,
        unitType: billingAccountAttrs.unitType,
    })
    if (!skipConsumer) {
        await registerServiceConsumerByTestClient(residentUser, {
            residentId: resident.id,
            accountNumber: billingAccountAttrs.number,
            organizationId: userClient.organization.id,
        })
    }
    const { thisMonthStart } = getStartDates()
    const receiptAttrs = { period: thisMonthStart, ...billingReceiptAttrs }
    const [receipt] = await createTestBillingReceipt(integrationClient, billingContext, billingProperty, billingAccount, receiptAttrs)

    return { receipt, resident }
}

module.exports = {
    makeBillingReceiptWithResident,
}