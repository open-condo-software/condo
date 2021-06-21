const { gql } = require('graphql-tag')

const GET_PROPERTY_BY_ID_QUERY = gql`
    query GetPropertyByIdQuery ($propertyId: ID!, $organizationId: ID) {
        objs: allProperties(where: {id: $propertyId, organization: { id: $organizationId }}) {
            id
            address
        }
    }
`

const GET_ALL_SOURCES_QUERY = gql`
    query selectSource ($value: String, $organizationId: ID) {
        objs: allTicketSources(where: {name_contains: $value, organization: { id: $organizationId }}) {
            id
            name
        }
    }
`

// TODO(pahaz): add organization relation to existing classifiers
const GET_ALL_CLASSIFIERS_QUERY = gql`
    query selectSource ($value: String) {
        objs: allTicketClassifiers(where: {name_contains_i: $value, organization_is_null: true, parent_is_null: true}) {
            id
            name
        }
    }
`

const GET_ALL_PROPERTIES_BY_VALUE_QUERY = gql`
    query selectProperty ($where: PropertyWhereInput, $orderBy: String) {
        objs: allProperties(where: $where, orderBy: $orderBy, first: 10) {
            id
            address
        }
    }
`

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrgarnizationEmployee ($value: String, $organizationId: ID) {
        objs: allOrganizationEmployees(where: {name_contains_i: $value, organization: { id: $organizationId }}) {
            name
            id
            user {
                id
            }
        }
    }
`

const GET_ALL_CONTACTS_QUERY = gql`
    query selectContact ($organizationId: ID, $propertyId: ID, $unitName: String) {
        objs: allContacts(where: {organization: { id: $organizationId }, property: { id: $propertyId }, unitName: $unitName}) {
            id
            name
            phone
        }
    }
`

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

export async function searchProperty (client, where, orderBy) {
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, { where, orderBy })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.address, value: x.id }))
    return []
}

export async function searchSingleProperty (client, propertyId, organizationId) {
    const { data, error } = await _search(client, GET_PROPERTY_BY_ID_QUERY, { propertyId, organizationId })

    if (error) {
        console.warn(error)
    }

    if (!data) {
        return undefined
    }

    return data.objs[0]
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

export function searchEmployee (organizationId) {
    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organizationId })
        if (error) console.warn(error)

        return data.objs.map(object => {
            if (object.user) {
                return ({ text: object.name, value: object.user.id })
            }
        }).filter(Boolean)
    }
}

export function searchContacts (client, { organizationId, propertyId, unitName }) {
    return _search(client, GET_ALL_CONTACTS_QUERY, { organizationId, propertyId, unitName })
}