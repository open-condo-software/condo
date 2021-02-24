import {
    GET_ALL_CLASSIFIERS_QUERY,
    GET_ALL_ORGANIZATION_EMPLOYEE_QUERY,
    GET_ALL_PROPERTIES_QUERY,
    GET_ALL_SOURCES_QUERY,
} from '../../schema/Ticket.gql'

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
