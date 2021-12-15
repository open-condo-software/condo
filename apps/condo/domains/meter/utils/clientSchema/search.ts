import { gql } from 'graphql-tag'

const GET_METER_QUERY = gql`
    query getMeter (
        $where: MeterWhereInput
    ) {
        objs: allMeters(
            where: $where
        ) {
            id
            number
            unitName
            organization {
                id
            }
        }
    }
`

const GET_METER_RESOURCE_QUERY = gql`
    query getMeterResource (
        $id: ID,
        $organizationId: ID,
        $propertyId: ID,
        $unitName: String
    ) {
        objs: allMeterResources(
            where: {
                id: $id
            }
        ) {
            id
            number
            unitName
            organization {
                id
            }
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

export async function searchMeter (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_METER_QUERY, { where, orderBy, first, skip })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.number, value: x.id }))
    return []
}

// TODO(MrFoxPro) Refactor search!
export async function searchMeterResource (client, where, orderBy, first = 10, skip = 0) {
    const { data = [], error } = await _search(client, GET_METER_RESOURCE_QUERY, { where, orderBy, first, skip })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.address, value: x.id }))
    return []
}
