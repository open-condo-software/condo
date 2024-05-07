const { gql } = require('graphql-tag')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const {
    PROPERTY_FIELDS: DEFAULT_PROPERTY_FIELDS,
    ADDRESS_META_SUBFIELDS_QUERY_LIST,
} = require('./fields')


const B2B_APP_ROLE_FIELDS = '{ id permissions role { id } app { id } }'
const B2BAppRole = generateGqlQueries('B2BAppRole', B2B_APP_ROLE_FIELDS)

const CONTACT_FIELDS = '{ id organization { id } name phone email isVerified unitName unitType property { id } }'
const Contact = generateGqlQueries('Contact', CONTACT_FIELDS)

const ORGANIZATION_FIELDS = '{ id }'
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS)

const ORGANIZATION_EMPLOYEE_FIELDS = '{ id role { id } user { id }  }'
const OrganizationEmployee = generateGqlQueries('OrganizationEmployee', ORGANIZATION_EMPLOYEE_FIELDS)

const PROPERTY_FIELDS = `{ ${DEFAULT_PROPERTY_FIELDS} }`
const Property = generateGqlQueries('Property', PROPERTY_FIELDS)

const RESIDENT_FIELDS = '{ id user { id name phone } property { id } unitName unitType residentOrganization { id } }'
const Resident = generateGqlQueries('Resident', RESIDENT_FIELDS)

const USER_FIELDS = '{ id phone name email }'
const User = generateGqlQueries('User', USER_FIELDS)

const GET_ALL_PROPERTY_WITH_META_QUERY = gql`
    query getAllPropertyIdsWithOrganizationId($where: PropertyWhereInput) {
        objs: allProperties(where: $where) { id name organization { id } type address addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } }
    }
`

const SEND_B2C_APP_PUSH_MESSAGE_MUTATION = gql`
    mutation sendB2CAppPushMessage ($data: SendB2CAppPushMessageInput!) {
        result: sendB2CAppPushMessage(data: $data) { id status }
    }
`

module.exports = {
    B2BAppRole,
    Contact,
    Organization,
    OrganizationEmployee,
    Property,
    Resident,
    User,
    GET_ALL_PROPERTY_WITH_META_QUERY,
    SEND_B2C_APP_PUSH_MESSAGE_MUTATION,
}
