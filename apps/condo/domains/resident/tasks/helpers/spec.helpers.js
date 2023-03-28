const { faker } = require('@faker-js/faker')
const { isEmpty } = require('lodash')

const {
    createTestBillingIntegration,
    createTestBillingReceipt,
    createTestBillingIntegrationOrganizationContext,
    createTestBillingIntegrationAccessRight,
    createTestBillingProperty,
    createTestBillingAccount,
} = require('@condo/domains/billing/utils/testSchema')
const { getStartDates } = require('@condo/domains/common/utils/date')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithProperty } = require('@condo/domains/property/utils/testSchema')
const { registerResidentByTestClient, registerServiceConsumerByTestClient } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithServiceUser, makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')

/**
 * Creates Organiazation, Property, Logged in User and Resident,
 * BillingIntegration, BillingIntegrationOrganizationContext,
 * BillingProperty and BillingAccount, ServiceConsumer, then BillingReceipt
 * and connects all of those entities between each other
 * @param billingReceiptAttrs
 * @param skipConsumer
 * @param residentUserData
 * @returns {Promise<{receipt: *, resident: *}>}
 */
const makeBillingReceiptWithResident = async (billingReceiptAttrs = {}, skipConsumer = false, residentUserData = {}, integrationAttrs = {}) => {
    const organizationUserWithProperty = await makeClientWithProperty(true)
    const support = await makeClientWithSupportUser()
    const [integration] = await createTestBillingIntegration(support, { contextDefaultStatus: CONTEXT_FINISHED_STATUS, ...integrationAttrs })
    const [billingContext] = await createTestBillingIntegrationOrganizationContext(organizationUserWithProperty, organizationUserWithProperty.organization, integration)
    const integrationClient = await makeClientWithServiceUser()
    await createTestBillingIntegrationAccessRight(support, integration, integrationClient.user)
    const [billingProperty] = await createTestBillingProperty(integrationClient, billingContext, { address: organizationUserWithProperty.property.address })
    const unitName = faker.random.alphaNumeric(8)
    const unitType = FLAT_UNIT_TYPE
    const [billingAccount, billingAccountAttrs] = await createTestBillingAccount(integrationClient, billingContext, billingProperty, { unitType, unitName })
    const residentUser = isEmpty(residentUserData) ? await makeClientWithResidentUser() : residentUserData
    const [resident] = await registerResidentByTestClient(residentUser, {
        address: organizationUserWithProperty.property.address,
        addressMeta: organizationUserWithProperty.property.addressMeta,
        unitName: billingAccountAttrs.unitName,
        unitType: billingAccountAttrs.unitType,
    })
    if (!skipConsumer) {
        await registerServiceConsumerByTestClient(residentUser, {
            residentId: resident.id,
            accountNumber: billingAccountAttrs.number,
            organizationId: organizationUserWithProperty.organization.id,
        })
    }
    const { thisMonthStart } = getStartDates()
    const receiptAttrs = { period: thisMonthStart, ...billingReceiptAttrs }
    const [receipt] = await createTestBillingReceipt(integrationClient, billingContext, billingProperty, billingAccount, receiptAttrs)

    return { receipt, resident, residentUser }
}

module.exports = {
    makeBillingReceiptWithResident,
}