const { gql } = require('graphql-tag')
const { isEmpty } = require('lodash')

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
    query selectProperty ($where: PropertyWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allProperties(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            address
        }
    }
`

const GET_ALL_PROPERTIES_WITH_MAP_BY_VALUE_QUERY = gql`
    query selectProperty ($where: PropertyWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allProperties(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            address
            map { sections { floors { units { label } } } }
        }
    }
`

const GET_ALL_DIVISIONS_BY_VALUE_QUERY = gql`
    query selectDivision ($where: DivisionWhereInput, $orderBy: String) {
        objs: allDivisions(where: $where, orderBy: $orderBy, first: 10) {
            id
            name
            properties { 
                id
            }
        }
    }
`

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrganizationEmployee ($value: String, $organizationId: ID) {
        objs: allOrganizationEmployees(where: {name_contains_i: $value, organization: { id: $organizationId }}) {
            name
            id
            user {
                id
            }
            role {
                id
                name
                canBeAssignedAsExecutor
                canBeAssignedAsResponsible
            }
        }
    }
`

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY_WITH_EMAIL = gql`
    query selectOrganizationEmployee ($value: String, $organizationId: ID) {
        objs: allOrganizationEmployees(where: {name_contains_i: $value, organization: { id: $organizationId } }) {
            id
            name
            email
            user {
                id
            }
        }
    }
`

const GET_ALL_CONTACTS_QUERY = gql`
    query selectContact ($organizationId: ID, $propertyId: ID, $unitName: String, $unitType: String) {
        objs: allContacts(where: {organization: { id: $organizationId }, property: { id: $propertyId }, unitName: $unitName, unitType: $unitType}) {
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

export async function searchProperty (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, { where, orderBy, first, skip })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.address, value: x.id }))

    return []
}

export async function searchPropertyWithMap (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_WITH_MAP_BY_VALUE_QUERY, { where, orderBy, first, skip })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ address: x.address, id: x.id, map: x.map }))

    return []
}

export function searchOrganizationProperty (organizationId) {
    if (!organizationId) return
    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        const where = {
            organization: {
                id: organizationId,
            },
            ...!isEmpty(searchText) ? { address_contains_i: searchText } : {},
            ...query,
        }
        const orderBy = 'address_ASC'
        const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, { where, orderBy, first, skip })
        if (error) console.warn(error)

        return data.objs.map(({ address, id }) => ({ text: address, value: id }))
    }
}

export function searchOrganizationDivision (organizationId: string) {
    if (!organizationId) return

    return async function (client, value) {
        const where = {
            organization: {
                id: organizationId,
                deletedAt: null,
            },
            name_contains_i: value,
            deletedAt: null,
        }
        const orderBy = 'name_ASC'
        const { data = [], error } = await _search(client, GET_ALL_DIVISIONS_BY_VALUE_QUERY, { where, orderBy })

        if (error) console.warn(error)

        return data.objs.map(({ name, properties }) => ({ text: name, value: String(properties.map(property => property.id)) }))
    }
}

export async function searchSingleProperty (client, propertyId, organizationId) {
    const { data, error } = await _search(client, GET_PROPERTY_BY_ID_QUERY, { propertyId, organizationId })

    if (error) console.warn(error)

    if (!data) return undefined

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

export function searchEmployeeUser (organizationId, filter = null) {
    if (!organizationId) return

    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organizationId })

        if (error) console.warn(error)

        const result = data.objs
            .filter(filter || Boolean)
            .filter(({ user }) => user)
            .map(object => {
                return ({ text: object.name, value: object.user.id, data: object })
            })

        return result
    }
}

export function searchEmployee (organizationId, filter) {
    if (!organizationId) return

    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY, { value, organizationId })

        if (error) console.warn(error)

        return data.objs
            .filter(filter || Boolean)
            .map(({ name, id }) => ({ text: name, value: id }))
    }
}

export function getEmployeeWithEmail (organizationId) {
    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY_WITH_EMAIL, { value, organizationId })

        if (error) console.warn(error)

        const result = data.objs.map(object => {
            if (object.user) {
                return ({ text: object.name, id: object.id, value: { id: object.user.id, hasEmail: !isEmpty(object.email) } })
            }
        }).filter(Boolean)

        return result
    }
}

export function searchContacts (client, { organizationId, propertyId, unitName, unitType }) {
    return _search(client, GET_ALL_CONTACTS_QUERY, { organizationId, propertyId, unitName, unitType })
}
