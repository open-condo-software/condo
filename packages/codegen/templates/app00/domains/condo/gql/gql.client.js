const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')


const CONDO_PREFIX = 'condo'

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const B2B_APP_CONTEXT_FIELDS = `{ app { id name } organization { id name } status ${COMMON_FIELDS} }`
const B2BAppContext = generateGqlQueries('B2BAppContext', B2B_APP_CONTEXT_FIELDS, CONDO_PREFIX)

const B2B_APP_ROLE_FIELDS = `{ permissions role { id canManageRoles } app { id } ${COMMON_FIELDS} }`
const B2BAppRole = generateGqlQueries('B2BAppRole', B2B_APP_ROLE_FIELDS, CONDO_PREFIX)

const ORGANIZATION_FIELDS = `{ ${COMMON_FIELDS} }`
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS, CONDO_PREFIX)

const ORGANIZATION_EMPLOYEE_FIELDS = `{ user { id } role { id canManageRoles } ${COMMON_FIELDS} }`
const OrganizationEmployee = generateGqlQueries('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS, CONDO_PREFIX)


const CONDO_CONFIG = [
    { name: 'B2BAppContext', operations: ['read'], fields: B2B_APP_CONTEXT_FIELDS },
    { name: 'B2BAppRole', operations: ['read', 'create'], fields: B2B_APP_ROLE_FIELDS },
    { name: 'Organization', operations: ['read'], fields: ORGANIZATION_FIELDS },
    { name: 'OrganizationEmployee', operations: ['read'], fields: ORGANIZATION_EMPLOYEE_FIELDS },
]


module.exports = {
    CONDO_CONFIG,
    B2BAppContext,
    B2BAppRole,
    Organization,
    OrganizationEmployee,
}
