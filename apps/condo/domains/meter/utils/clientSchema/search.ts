const { gql } = require('graphql-tag')

const GET_ALL_METER_RESOURCE_QUERY = gql`
    query selectMeterResources {
        objs: allMeterResources {
            id
            name
        }
    }
`

export function searchMeterResources (organizationId) {
    if (!organizationId) return
    return async function (client, value) {
        const { data, error } = await client.query({
            query: GET_ALL_METER_RESOURCE_QUERY,
            variables: { value, organizationId },
            fetchPolicy: 'network-only',
        })
        if (error) console.warn(error)

        return data.objs.map(({ name, id }) => ({ text: name, value: id }))
    }
}