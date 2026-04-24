import { BillingIntegrationOrganizationContext } from '@app/condo/schema'
import { gql } from 'graphql-tag'
import isEmpty from 'lodash/isEmpty'

const GET_ALL_BILLING_PROPERTIES_BY_VALUE_QUERY = gql`
    query selectBillingProperty ($where: BillingPropertyWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allBillingProperties(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            address
        }
    }
`

const GET_ALL_ACQUIRING_INTEGRATION_CONTEXTS_BY_VALUE_QUERY = gql`
    query selectAcquiringIntegrationContext ($where: AcquiringIntegrationContextWhereInput, $orderBy: String, $first: Int, $skip: Int) {
        objs: allAcquiringIntegrationContexts(where: $where, orderBy: $orderBy, first: $first, skip: $skip) {
            id
            integration {
               id
               name
            }
        }
    }
`

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
        fetchPolicy: 'cache-first',
    })
}

export function searchBillingProperty (billingContext: BillingIntegrationOrganizationContext) {
    if (!billingContext) {
        return
    }

    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        const where = {
            context: {
                id: billingContext.id,
            },
            ...isEmpty(searchText) ? {} : { address_contains_i: searchText },
            ...query,
        }
        const orderBy = 'address_ASC'
        const { data = [], error } = await _search(
            client,
            GET_ALL_BILLING_PROPERTIES_BY_VALUE_QUERY,
            {
                where,
                orderBy,
                first,
                skip,
            },
        )

        if (error) {
            console.warn(error)
        }

        return data.objs.map(({ address, id }) => ({ text: address, value: id }))
    }
}

export function searchAcquiringIntegration (organizationId: string) {
    if (!organizationId) {
        return
    }

    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        const where = {
            organization: {
                id: organizationId,
            },
            ...isEmpty(searchText) ? {} : { integration: { name_contains_i: searchText } },
            ...query,
        }
        const orderBy = 'integration_ASC'
        const { data = [], error } = await _search(
            client,
            GET_ALL_ACQUIRING_INTEGRATION_CONTEXTS_BY_VALUE_QUERY,
            {
                where,
                orderBy,
                first,
                skip,
            },
        )

        if (error) {
            console.warn(error)
        }

        return data.objs.map(({ integration, id }) => ({ text: integration.name, value: id }))
    }
}