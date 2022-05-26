const { gql } = require('graphql-tag')

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'network-only',
    })
}

const GET_ALL_PROPERTIES_WITH_MAP_BY_VALUE_QUERY = gql`
    query selectProperty ($where: PropertyWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allProperties(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            address
            map { sections { floors { units { type label } } } parking { floors { units { type label } } } }
        }
    }
`

export async function searchPropertyWithMap (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_ALL_PROPERTIES_WITH_MAP_BY_VALUE_QUERY, { where, orderBy, first, skip })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ address: x.address, id: x.id, map: x.map }))

    return []
}