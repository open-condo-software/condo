import { ApolloClient, DocumentNode } from '@apollo/client'
import {
    GetContactForAiAssistantDocument,
    GetIncidentsForAiAssistantDocument,
    GetNewsItemsForAiAssistantDocument,
    GetOrganizationEmployeesForAiAssistantDocument,
    GetPropertiesDocument,
    GetTicketCommentsForAiAssistantDocument,
    GetTicketsForAiAssistantDocument,
    GetTicketWithDetailsForAiAssistantDocument,
} from '@app/condo/gql'

const DEFAULT_MAX_LIMIT = 1000
const DEFAULT_CHUNK_SIZE = 100
const DEFAULT_FIRST = 100
const DEFAULT_CHUNK_DELAY_MS = 1000 // 1s

export type ToolCallResult = {
    name: string
    args: any
    result?: string
    resultMessage?: string | { key: string }
    error?: string
    errorMessage?: string
}

export type UserData = {
    organizationId: string
    userId: string
}

type ToolConfig = {
    name: string
    query: DocumentNode
    resultKey: string | null
    // Use this to transform tool args to GraphQL variables and/or add filters
    getGraphQLVariables: (args: any, userData: UserData) => any
    // If provided and chunking is enabled, tool will use this limit as maximum limit for each query
    limit?: number
    chunkSize?: number
    chunkDelay?: number
    // If true, tool will use chunking, if `skip` or `first` are not provided in args
    // If false (default) tool will always use single query
    canUseChunking?: boolean
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
    // Queries with chunking
    getTickets: {
        name: 'getTickets',
        query: GetTicketsForAiAssistantDocument,
        resultKey: 'tickets',
        canUseChunking: true,
        limit: 2500,
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first,
                skip: args.skip,
            }
        },
    },
    getNewsItems: {
        name: 'getNewsItems',
        query: GetNewsItemsForAiAssistantDocument,
        resultKey: 'newsItems',
        canUseChunking: true,
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['publishedAt_DESC'],
                first: args.first,
                skip: args.skip,
            }
        },
    },
    getIncidents: {
        name: 'getIncidents',
        query: GetIncidentsForAiAssistantDocument,
        resultKey: 'incidents',
        canUseChunking: true,
        chunkSize: 200,
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['workFinish_DESC'],
                first: args.first,
                skip: args.skip,
            }
        },
    },
    getTicketComments: {
        name: 'getTicketComments',
        query: GetTicketCommentsForAiAssistantDocument,
        resultKey: 'ticketComments',
        canUseChunking: true,
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.ticket = {
                    ...where.ticket,
                    organization: { id: userData.organizationId },
                }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first,
                skip: args.skip,
            }
        },
    },
    getContacts: {
        name: 'getContacts',
        query: GetContactForAiAssistantDocument,
        resultKey: 'contacts',
        canUseChunking: true,
        chunkSize: 200,
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first,
                skip: args.skip,
            }
        },
    },

    // Queries WO Chunking
    getOrganizationEmployees: {
        name: 'getOrganizationEmployees',
        query: GetOrganizationEmployeesForAiAssistantDocument,
        resultKey: 'employees',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first || 300,
                skip: args.skip || 0,
            }
        },
    },
    getProperties: {
        name: 'getProperties',
        query: GetPropertiesDocument,
        resultKey: 'properties',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first || 300,
            }
        },
    },

    // Custom Queries (Queries that do not support first / skip))
    getTicketWithDetails: {
        name: 'getTicketWithDetails',
        query: GetTicketWithDetailsForAiAssistantDocument,
        resultKey: null,
        getGraphQLVariables: (args, _) => {
            args = args || {}
            if (!args.id) {
                throw new Error('Ticket ID is required for getTicketWithDetails')
            }
            return {
                id: args.id,
            }
        },
    },
}

const extractDataFromResponse = (res: any, config: ToolConfig): any => {
    if (res.error || res.errors?.length) {
        throw res.error || new Error(res.errors?.map(e => e.message).join(', '))
    }
    return config.resultKey ? res.data?.[config.resultKey] || [] : res.data
}

const runApolloQueryTool = async (
    config: ToolConfig,
    args: any,
    userData: UserData,
    client: ApolloClient<any>
): Promise<ToolCallResult> => {
    try {
        let resultData: any

        // true if query can use chunking and user did not set skip or first
        const shouldUseChunking =
            config.canUseChunking &&
            typeof args?.first !== 'number' &&
            typeof args?.skip !== 'number'

        const variables = config.getGraphQLVariables(args, userData)

        if (!shouldUseChunking) {
            // User did set skip, but didn't set first or vice versa
            // if canUseChunking -- first and skip are supported by query
            if (config.canUseChunking) {
                if (typeof variables.first !== 'number') { variables.first = DEFAULT_FIRST}
                if (typeof variables.skip !== 'number') { variables.skip = 0}
            }

            const res = await client.query({
                query: config.query,
                variables,
                fetchPolicy: 'cache-first',
            })

            resultData = extractDataFromResponse(res, config)
        } else {
            const all: any[] = []
            let skip = 0
            let chunk: any[]
            const limit = config.limit || DEFAULT_MAX_LIMIT
            const size = config.chunkSize || DEFAULT_CHUNK_SIZE
            const chunkDelay = config.chunkDelay || DEFAULT_CHUNK_DELAY_MS
            let maxIterations = Math.ceil(limit / size)

            do {
                const res = await client.query({
                    query: config.query,
                    variables: { ...variables, first: size, skip },
                    fetchPolicy: 'cache-first',
                })

                chunk = extractDataFromResponse(res, config)
                if (!Array.isArray(chunk) || !chunk.length) break

                all.push(...chunk)
                skip += chunk.length

                // Do not add delay after the last chunk
                if (maxIterations > 1 && chunk.length === size) {
                    await new Promise(resolve => setTimeout(resolve, chunkDelay))
                }
            } while (--maxIterations > 0 && chunk.length === size)

            resultData = all
        }

        return { name: config.name, args, result: resultData }
    } catch (error) {
        return {
            name: config.name,
            args,
            error: error instanceof Error ? error.name : 'UnknownError',
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        }
    }
}

export const runToolCall = async (
    name: string,
    args: any,
    userData: UserData,
    client?: ApolloClient<any>,
    intl?: any
): Promise<ToolCallResult> => {
    const config = TOOL_CONFIGS[name]
    
    if (!config) {
        return {
            name,
            args,
            error: 'UnsupportedTool',
            errorMessage: intl ? intl.formatMessage({ id: 'ai.tools.error.unsupported' }, { toolName: name }) : `Tool call "${name}" is not supported`,
        }
    }

    if (!client) {
        return {
            name,
            args,
            error: 'MissingClient',
            errorMessage: 'Apollo client is required',
        }
    }

    const result = await runApolloQueryTool(config, args, userData, client)
    
    if (result.resultMessage && typeof result.resultMessage === 'object' && 'key' in result.resultMessage) {
        const { key } = result.resultMessage
        const messageId = key ?? 'ai.chat.dataFetching'
        
        const translatedMessage = intl?.formatMessage({ id: messageId })
        
        return {
            ...result,
            resultMessage: translatedMessage,
        }
    }
    
    return result
}