const { genTestGQLUtils } = require('@core/keystone/gen.gql.utils')
const gql = require('graphql-tag')

const TICKET_FIELDS = '{ id dv sender organization { id name } property { id name address } status { id name type organization { id } } statusReason statusReopenedCounter number client { id name } clientName clientEmail unitName clientPhone operator { id name } assignee { id name } executor { id name } classifier { id name organization { id } parent { id name } } details related { id details } meta source { id name type } sourceMeta v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt }'
const Ticket = genTestGQLUtils('Ticket', TICKET_FIELDS)


// TODO(pahaz): add organization filter
const GET_ALL_SOURCES_QUERY = gql`
    query selectSource ($value: String) {
        objs: allTicketSources(where: {name_contains: $value, organization_is_null: true}) {
            id
            name
        }
    }
`

// TODO(pahaz): add organization filter
const GET_ALL_CLASSIFIERS_QUERY = gql`
    query selectSource ($value: String) {
        objs: allTicketClassifiers(where: {name_contains: $value, organization_is_null: true, parent_is_null: true}) {
            id
            name
        }
    }
`

// TODO(pahaz): add organization filter
const GET_ALL_PROPERTIES_QUERY = gql`
    query selectProperty ($value: String) {
        objs: allProperties(where: {name_contains: $value}) {
            id
            name
        }
    }
`

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrgarnizationEmployee ($value: String, $organization: ID) {
        objs: allOrganizationEmployees(where: {name_contains: $value, organization: {id: $organization}}) {
            name
            user {
                id
            }
        }
    }
`

module.exports = {
    Ticket,
    GET_ALL_SOURCES_QUERY,
    GET_ALL_CLASSIFIERS_QUERY,
    GET_ALL_PROPERTIES_QUERY,
    GET_ALL_ORGANIZATION_EMPLOYEE_QUERY,
}
