const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const BILLING_INTEGRATION_FIELDS = '{ id dv name v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt }'
const BillingIntegration = genTestGQLUtils('BillingIntegration', BILLING_INTEGRATION_FIELDS)

const BillingIntegrationAccessRight = genTestGQLUtils('BillingIntegrationAccessRight', `{ id dv integration ${BILLING_INTEGRATION_FIELDS} user { id } createdBy { id name } updatedBy { id name } createdAt updatedAt }`)
const BillingIntegrationOrganizationContext = genTestGQLUtils('BillingIntegrationOrganizationContext', `{ id dv v integration ${BILLING_INTEGRATION_FIELDS} organization { id } settings state createdBy { id name } updatedBy { id name } createdAt updatedAt }`)
const BillingIntegrationLog = genTestGQLUtils('BillingIntegrationLog', `{ id dv v context { dv integration ${BILLING_INTEGRATION_FIELDS} organization { id } } type message meta createdBy { id name } updatedBy { id name } createdAt updatedAt }`)

module.exports = {
    BillingIntegration,
    BillingIntegrationAccessRight,
    BillingIntegrationOrganizationContext,
    BillingIntegrationLog,
}
