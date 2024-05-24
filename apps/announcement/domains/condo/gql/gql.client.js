const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const { PROPERTY_FIELDS: DEFAULT_PROPERTY_FIELDS, CONTACT_FIELDS: DEFAULT_CONTACT_FIELDS } = require('./fields')


const CONDO_PREFIX = 'condo'

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const B2B_APP_CONTEXT_FIELDS = `{ app { id name } organization { id name } status ${COMMON_FIELDS} }`
const B2BAppContext = generateGqlQueries('B2BAppContext', B2B_APP_CONTEXT_FIELDS, CONDO_PREFIX)

const B2B_APP_ROLE_FIELDS = `{ permissions role { id canManageRoles } app { id } ${COMMON_FIELDS} }`
const B2BAppRole = generateGqlQueries('B2BAppRole', B2B_APP_ROLE_FIELDS, CONDO_PREFIX)

const CONTACT_FIELDS = `{ ${DEFAULT_CONTACT_FIELDS} }`
const Contact = generateGqlQueries('Contact', CONTACT_FIELDS, CONDO_PREFIX)

const ORGANIZATION_FIELDS = `{ ${COMMON_FIELDS} }`
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS, CONDO_PREFIX)

const ORGANIZATION_EMPLOYEE_FIELDS = `{ user { id } role { id canManageRoles } ${COMMON_FIELDS} }`
const OrganizationEmployee = generateGqlQueries('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS, CONDO_PREFIX)

const ORGANIZATION_EMPLOYEE_ROLE_FIELDS = '{ organization { id } name canManageRoles id }'
const OrganizationEmployeeRole = generateGqlQueries('OrganizationEmployeeRole', ORGANIZATION_EMPLOYEE_ROLE_FIELDS, CONDO_PREFIX)

const PROPERTY_FIELDS = `{ ${DEFAULT_PROPERTY_FIELDS} }`
const Property = generateGqlQueries('Property', PROPERTY_FIELDS, CONDO_PREFIX)

const TICKET_FIELDS = `{ source { id name } organization { id name } property { id address } unitType unitName clientName clientPhone details source { id name type } classifier { id place { id name } category { id name } problem { id name } } ${COMMON_FIELDS} }`
const Ticket = generateGqlQueries('Ticket', TICKET_FIELDS, CONDO_PREFIX)

const RESIDENT_FIELDS = `{ user { id name phone deletedAt } ${COMMON_FIELDS} }`

const CONDO_CONFIG = [
    { name: 'B2BAppContext', operations: ['read'], fields: B2B_APP_CONTEXT_FIELDS },
    { name: 'B2BAppRole', operations: ['read', 'create'], fields: B2B_APP_ROLE_FIELDS },
    { name: 'Contact', operations: ['read'], fields: CONTACT_FIELDS },
    { name: 'Organization', operations: ['read'], fields: ORGANIZATION_FIELDS },
    { name: 'OrganizationEmployee', operations: ['read'], fields: ORGANIZATION_EMPLOYEE_FIELDS },
    { name: 'OrganizationEmployeeRole', operations: ['read'], fields: ORGANIZATION_EMPLOYEE_ROLE_FIELDS },
    { name: 'Property', operations: ['read'], fields: PROPERTY_FIELDS },
    { name: 'Ticket', operations: ['read', 'create'], fields: TICKET_FIELDS },
    { name: 'Resident', operations: ['read'], fields: RESIDENT_FIELDS },
]


module.exports = {
    CONDO_CONFIG,
    B2BAppContext,
    B2BAppRole,
    Contact,
    Organization,
    OrganizationEmployee,
    OrganizationEmployeeRole,
    Property,
    Ticket,
}
