const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const B2B_APP_CONTEXT_FIELDS = `{ app { id name } organization { id name } status ${COMMON_FIELDS} }`
const B2BAppContext = generateGqlQueries('B2BAppContext', B2B_APP_CONTEXT_FIELDS)

const B2B_APP_ROLE_FIELDS = '{ id permissions role { id } app { id } }'
const B2BAppRole = generateGqlQueries('B2BAppRole', B2B_APP_ROLE_FIELDS)

const ORGANIZATION_FIELDS = '{ id }'
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS)

const ORGANIZATION_EMPLOYEE_FIELDS = `{ id role { id } user { id } ${COMMON_FIELDS} }`
const OrganizationEmployee = generateGqlQueries('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS)

const USER_FIELDS = '{ id phone name email }'
const User = generateGqlQueries('User', USER_FIELDS)

const CONDO_CONFIG = [
    { name: 'B2BAppContext', operations: ['read'], fields: B2B_APP_CONTEXT_FIELDS },
    { name: 'B2BAppRole', operations: ['read', 'create'], fields: B2B_APP_ROLE_FIELDS },
    { name: 'Organization', operations: ['read'], fields: ORGANIZATION_FIELDS },
    { name: 'OrganizationEmployee', operations: ['read'], fields: ORGANIZATION_EMPLOYEE_FIELDS },
]

module.exports = {
    B2BAppRole,
    Organization,
    OrganizationEmployee,
    User,
    B2BAppContext,
    CONDO_CONFIG,
}
