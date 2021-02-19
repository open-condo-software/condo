const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')

const BILLING_INTEGRATION_FIELDS = '{ id dv name v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt }'
const BillingIntegration = genTestGQLUtils('BillingIntegration', BILLING_INTEGRATION_FIELDS)

module.exports = {
    BillingIntegration,
}
