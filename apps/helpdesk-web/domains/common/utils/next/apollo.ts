import getConfig from 'next/config'

import { ListHelper } from '@open-condo/apollo'
import type { InitCacheConfig, ApolloHelperOptions } from '@open-condo/apollo'
import { getTracingMiddleware } from '@open-condo/miniapp-utils'


const { publicRuntimeConfig: { apolloGraphQLUrl, frontendUrl, currentVersion } } = getConfig()

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
                    allOrganizationLinks: {
                        keyArgs: ['where'],
                        read: listHelper.getReadFunction('paginate'),
                        merge: listHelper.mergeLists,
                    },
                    allMessages: {
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
                },
            },

            // NOTE: legacy
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
            },
        },
    }
}


export const apolloHelperOptions: ApolloHelperOptions = {
    uri: apolloGraphQLUrl,
    cacheConfig,
    middlewares: [
        getTracingMiddleware({
            serviceUrl: frontendUrl,
            codeVersion: currentVersion,
            target: 'cc-app',
        }),
    ],
}
