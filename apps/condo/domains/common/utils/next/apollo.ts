import getConfig from 'next/config'

import { ListHelper } from '@open-condo/apollo'
import type { InitCacheConfig } from '@open-condo/apollo'

import { BILLING_RECEIPT_SERVICE_FIELD_NAME } from '@condo/domains/billing/constants/constants'


const { publicRuntimeConfig: { apolloGraphQLUrl } } = getConfig()

const cacheConfig: InitCacheConfig = (cacheOptions) => {
    const listHelper = new ListHelper({ cacheOptions })

    return {
        typePolicies: {
            Query: {
                fields: {
                    allOrganizationEmployees: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                },
            },

            // NOTE: legacy
            // Configuration for `InMemoryCache` of Apollo
            // Add fields, related to pagination strategies of Apollo.
            // Items of some GraphQL global fields needs to be appended to list,
            // when paginated, rather than to be displayed as a slice of data, —
            // its like "Infinite scrolling" UI pattern. For example, fetching
            // more changes of a ticket on button click.
            // For those items, we need to set `concatPagination` strategy.
            // https://www.apollographql.com/docs/react/pagination/core-api/
            [BILLING_RECEIPT_SERVICE_FIELD_NAME]: {
                // avoiding of building cache from ID on client, since Service ID is not UUID and will be repeated
                keyFields: false,
            },
            BuildingSection: {
                keyFields: false,
            },
            BuildingFloor: {
                keyFields: false,
            },
            BuildingUnit: {
                keyFields: false,
            },
        },
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds
            types: {
                OrganizationEmployee: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
            },
        },
    }
}

function getApiUrl (): string {
    return apolloGraphQLUrl
}

export const apolloHelperOptions = {
    uri: getApiUrl,
    cacheConfig,
}