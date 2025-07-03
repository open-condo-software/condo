const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')


const B2B_APP_ROLE_FIELDS = '{ id permissions role { id } app { id } }'
const B2BAppRole = generateGqlQueries('B2BAppRole', B2B_APP_ROLE_FIELDS)

const ORGANIZATION_FIELDS = '{ id }'
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS)

const ORGANIZATION_EMPLOYEE_FIELDS = '{ id role { id } user { id }  }'
const OrganizationEmployee = generateGqlQueries('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS)

const USER_FIELDS = '{ id phone name email }'
const User = generateGqlQueries('User', USER_FIELDS)


module.exports = {
    B2BAppRole,
    Organization,
    OrganizationEmployee,
    User,
}
