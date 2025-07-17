import { Property } from '@app/condo/schema'
import { gql } from 'graphql-tag'
import { isEmpty } from 'lodash'

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const GET_ALL_PROPERTY_SCOPES_BY_VALUE_QUERY = gql`
    query selectPropertyScope ($where: PropertyScopeWhereInput, $orderBy: String) {
        objs: allPropertyScopes(where: $where, orderBy: $orderBy, first: 100) {
            id
            name
            hasAllProperties
        }
    }
`

const GET_ALL_PROPERTY_SCOPE_PROPERTIES_QUERY = gql`
    query selectPropertyScopeProperty ($where: PropertyScopePropertyWhereInput, $first: Int) {
        objs: allPropertyScopeProperties(where: $where, first: $first) {
            id
            propertyScope { id }
            property { id }
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

export function searchOrganizationPropertyScope (organizationId: string) {
    if (!organizationId) return

    return async function (client, value) {
        const where = {
            organization: {
                id: organizationId,
            },
            name_contains_i: value,
        }
        const orderBy = 'name_ASC'
        const { data: propertyScopes = [], error } = await _search(client, GET_ALL_PROPERTY_SCOPES_BY_VALUE_QUERY, { where, orderBy })

        if (error) console.warn(error)


        const propertyScopeProperties = []
        for (const scope of propertyScopes.objs) {
            const { data } = await _search(
                client,
                GET_ALL_PROPERTY_SCOPE_PROPERTIES_QUERY,
                {
                    where: {
                        propertyScope: { id: scope.id },
                    },
                    first: 300,
                }
            )

            propertyScopeProperties.push(...data.objs)
        }

        return propertyScopes.objs.map(({ id, name, hasAllProperties }) => {
            if (hasAllProperties) {
                return { text: name, key: id, value: [], hasAllProperties }
            }

            const propertyIds = propertyScopeProperties
                .filter(scope => scope.property && scope.propertyScope && scope.propertyScope.id === id)
                .map(scope => scope.property.id)

            return { text: name, key: id, value: propertyIds }
        })
    }
}

export function searchOrganizationProperty (organizationId: string, selectedProperties?: Array<Property>) {
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

        const resultWithSelectedProperties = data.objs.concat(selectedProperties ?? [])

        return resultWithSelectedProperties.map(({ address, id }) => ({ text: address, value: id }))
    }
}