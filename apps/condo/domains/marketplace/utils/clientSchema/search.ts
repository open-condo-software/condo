import { gql } from 'graphql-tag'
import isEmpty from 'lodash/isEmpty'


async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const GET_ALL_PROPERTIES_BY_VALUE_QUERY = gql`
    query selectProperty ($where: PropertyWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allProperties(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            address
        }
    }
`

export function searchOrganizationPropertyWithExclusion (organizationId, excludedPropertyIds = []) {
    if (!organizationId) return
    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        const where = {
            organization: {
                id: organizationId,
            },
            id_not_in: excludedPropertyIds,
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