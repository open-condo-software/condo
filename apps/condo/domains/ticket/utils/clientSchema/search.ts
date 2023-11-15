import { TicketStatusTypeType } from '@app/condo/schema'

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

const GET_ALL_ORGANIZATION_EMPLOYEE_QUERY = gql`
    query selectOrganizationEmployee ($value: String, $organizationId: ID) {
        objs: allOrganizationEmployees(where: {name_contains_i: $value, organization: { id: $organizationId }}) {
            isBlocked
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

const GET_ALL_TICKETS_QUERY = gql`
    query selectTickets ($where: TicketWhereInput, $first: Int, $skip: Int) {
        objs: allTickets(where: $where, first: $first, skip: $skip) {
            id
            number
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
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, {
        where,
        orderBy,
        first,
        skip,
    })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.address, value: x.id }))

    return []
}

export async function searchPropertyWithMap (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_WITH_MAP_BY_VALUE_QUERY, {
        where,
        orderBy,
        first,
        skip,
    })
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
        const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, {
            where,
            orderBy,
            first,
            skip,
        })
        if (error) console.warn(error)

        return data.objs.map(({ address, id }) => ({ text: address, value: id }))
    }
}

export function searchOrganizationPropertyWithoutPropertyHint (organizationId, organizationPropertiesWithTicketHint = []) {
    if (!organizationId) return
    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        const where = {
            organization: {
                id: organizationId,
            },
            id_not_in: organizationPropertiesWithTicketHint,
            ...!isEmpty(searchText) ? { address_contains_i: searchText } : {},
            ...query,
        }
        const orderBy = 'address_ASC'
        const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_BY_VALUE_QUERY, {
            where,
            orderBy,
            first,
            skip,
        })
        if (error) console.warn(error)

        return data.objs.map(({ address, id }) => ({ text: address, value: id }))
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
            .map(({ name, id, isBlocked }) => ({ text: name, value: id, isBlocked }))
    }
}

export function getEmployeeWithEmail (organizationId) {
    return async function (client, value) {
        const { data, error } = await _search(client, GET_ALL_ORGANIZATION_EMPLOYEE_QUERY_WITH_EMAIL, {
            value,
            organizationId,
        })

        if (error) console.warn(error)

        const result = data.objs.map(object => {
            if (object.user) {
                return ({
                    text: object.name,
                    id: object.id,
                    value: { id: object.user.id, hasEmail: !isEmpty(object.email) },
                })
            }
        }).filter(Boolean)

        return result
    }
}

export function getOrganizationTickets (organizationId) {
    if (!organizationId) return

    return async function (client, value, query, first = 10, skip = 0) {
        const organizationQuery = { organization: { id: organizationId } }
        const where = (value && !isNaN(Number(value))) ?
            { number: Number(value), ...organizationQuery } : organizationQuery

        const { data, error } = await _search(client, GET_ALL_TICKETS_QUERY, {
            where: { ...where, ...query },
            first,
            skip,
        })

        if (error) console.warn(error)

        const result = data.objs.map(object => {
            return ({
                text: object.number,
                id: object.id,
                value: object.id,
            })
        }).filter(Boolean)

        return result
    }
}


export function searchContacts (client, { organizationId, propertyId, unitName, unitType }) {
    return _search(client, GET_ALL_CONTACTS_QUERY, { organizationId, propertyId, unitName, unitType })
}

export const GET_TICKETS_COUNT_QUERY = gql`
     query selectTicketsCount ($where: TicketWhereInput, $whereWithoutStatuses: TicketWhereInput) {
        all: _allTicketsMeta(where: $where) {
            count
        }
        ${TicketStatusTypeType.NewOrReopened}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.NewOrReopened} } }]}) {
            count
        }
        ${TicketStatusTypeType.Processing}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.Processing} } }]}) {
            count
        }
        ${TicketStatusTypeType.Deferred}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.Deferred} } }]}) {
            count
        }
        ${TicketStatusTypeType.Canceled}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.Canceled} } }]}) {
            count
        }
        ${TicketStatusTypeType.Completed}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.Completed} } }]}) {
            count
        }
        ${TicketStatusTypeType.Closed}: _allTicketsMeta(where: { AND: [$whereWithoutStatuses, { status: { type: ${TicketStatusTypeType.Closed} } }]}) {
            count
        }
    }
`