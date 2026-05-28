const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const CONDO_PREFIX = 'condo'

const CONDO_ORGANIZATION_FIELDS = '{ id name tin }'
const CONDO_B2B_APP_CONTEXT_FIELDS = '{ id status app { id name } }'

const CondoOrganizationGql = generateGqlQueries('Organization', CONDO_ORGANIZATION_FIELDS, CONDO_PREFIX)
const CondoB2BAppContextGql = generateGqlQueries('B2BAppContext', CONDO_B2B_APP_CONTEXT_FIELDS, CONDO_PREFIX)

const CONDO_CONFIG = [
    { name: 'B2BAppContext', operations: ['read', 'update'], fields: CONDO_B2B_APP_CONTEXT_FIELDS },
    { name: 'Organization', operations: ['read'], fields: CONDO_ORGANIZATION_FIELDS },
]

module.exports = {
    CONDO_CONFIG,
    CondoOrganizationGql,
    CondoB2BAppContextGql,
}
