import getConfig from 'next/config'

import { ListHelper } from '@open-condo/apollo'
import type { InitCacheConfig, ApolloHelperOptions } from '@open-condo/apollo'
import { getTracingMiddleware } from '@open-condo/miniapp-utils'

import { BILLING_RECEIPT_SERVICE_FIELD_NAME } from '@condo/domains/billing/constants/constants'


const { publicRuntimeConfig: { apolloGraphQLUrl, serverUrl, currentVersion } } = getConfig()

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
                    allMessages: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allPropertyScopeProperties: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allPropertyScopeOrganizationEmployees: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allPropertyScopes: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allIncidents: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allContacts: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allIncidentChanges: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allIncidentProperties: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allIncidentClassifierIncidents: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allBillingIntegrationOrganizationContexts: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTickets: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketChanges: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketComments: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketCommentFile: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketStatuses: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketFiles: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allInvoices: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allProperties: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTourStep: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allB2BApps: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allOrganizationEmployeeSpecializations: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allOrganizationEmployeeRequests: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allPaymentsFiles: {
                        keyArgs: ['where', 'skip'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allTicketCategoryClassifiers: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('showAll'),
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
                _QueryMeta: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                Message: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                Ticket: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                TicketChange: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                TicketComment: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                TicketCommentFile: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                TicketStatus: {
                    timeToLive: 60 * 60 * 1000, // 1 hour in milliseconds
                },
                TicketSource: {
                    timeToLive: 60 * 60 * 1000, // 1 hour in milliseconds
                },
                TicketClassifier: {
                    timeToLive: 60 * 60 * 1000, // 1 hour in milliseconds
                },
                CallRecord: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                CallRecordFragment: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                Invoice: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                Incident: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                IncidentProperty: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                IncidentClassifierIncident: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
                OrganizationEmployeeRequest: {
                    timeToLive: 5 * 60 * 1000,
                },
                GetNewsSharingRecipientsOutput: {
                    timeToLive: 60 * 1000, // 1 minute in milliseconds
                },
            },
        },
    }
}

export const apolloHelperOptions: ApolloHelperOptions = {
    uri: apolloGraphQLUrl,
    cacheConfig,
    middlewares: [
        getTracingMiddleware({
            serviceUrl: serverUrl,
            codeVersion: currentVersion,
            target: 'condo-app',
        }),
    ],
}
