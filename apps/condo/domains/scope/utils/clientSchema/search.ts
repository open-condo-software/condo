import { gql } from 'graphql-tag'

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const GET_ALL_PROPERTY_SCOPES_BY_VALUE_QUERY = gql`
    query selectPropertyScope ($where: PropertyScopeWhereInput, $orderBy: String) {
        objs: allPropertyScopes(where: $where, orderBy: $orderBy) {
            id
            name
            hasAllProperties
        }
    }
`

const GET_ALL_PROPERTY_SCOPE_PROPERTIES_QUERY = gql`
    query selectPropertyScopeProperty ($where: PropertyScopePropertyWhereInput, $orderBy: String) {
        objs: allPropertyScopeProperties(where: $where, orderBy: $orderBy) {
            id
            propertyScope { id }
            property { id }
        }
    }
`

export function searchOrganizationPropertyScope (organizationId: string) {
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
        const { data = [], error } = await _search(client, GET_ALL_PROPERTY_SCOPES_BY_VALUE_QUERY, { where, orderBy })

        if (error) console.warn(error)

        const propertyScopes = data.objs
        const { data: propertyScopePropertiesData = [], error: propertyScopePropertiesError } = await _search(
            client,
            GET_ALL_PROPERTY_SCOPE_PROPERTIES_QUERY,
            {
                where: {
                    propertyScope: { id_in: propertyScopes.map(scope => scope.id) },
                },
            }
        )

        if (propertyScopePropertiesError) console.warn(propertyScopePropertiesError)

        const propertyScopeProperties = propertyScopePropertiesData.objs.filter(scope => !scope.hasAllProperties)

        return propertyScopes.map(({ id, name }) => {
            const properties = propertyScopeProperties
                .filter(scope => scope.propertyScope.id === id)
                .map(scope => scope.property.id)

            return { text: name, value: String(properties) }
        })
    }
}