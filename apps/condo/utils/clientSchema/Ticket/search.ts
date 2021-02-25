const gql = require('graphql-tag')

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

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
    })
}

export async function searchProperty (client, value) {
    const { data, error } = await _search(client, GET_ALL_PROPERTIES_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

export async function searchTicketSources (client, value) {
    const { data, error } = await _search(client, GET_ALL_SOURCES_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

export async function searchTicketClassifier (client, value) {
    const { data, error } = await _search(client, GET_ALL_CLASSIFIERS_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

export function searchEmployee (organization) {
    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organization })
        if (error) console.warn(error)
        if (data) return data.objs.map(x => ({ text: x.name, value: x.user.id }))
        return []
    }
}
