import { ApolloClient } from '@apollo/client'
import { GetContactEditorOrganizationEmployeesDocument, GetTicketsForAiAssistantDocument, GetIncidentsDocument, GetTicketCommentsDocument, GetPropertiesDocument, GetContactForClientCardDocument, GetNewsItemsForAiAssistantDocument, GetTicketWithDetailsForAiAssistantDocument } from '@app/condo/gql'

const DEFAULT_MAX_LIMIT = 1000
const DEFAULT_CHUNK_SIZE = 100
const DEFAULT_FIRST = 100
const DEFAULT_CHUNK_DELAY = 1000 // 1s

export type ToolCallResult = {
    name: string
    args: any
    result?: any
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
    query: any
    resultKey: string | null
    // Use this to transform tool args to GraphQL variables and/or add filters
    getGraphQLVariables: (args: any, userData: UserData) => any
    // If provided and chunking is enabled, tool will use this limit as maximum limit for each query
    limit?: number
    chunkSize?: number
    chunkDelay?: number
    // If true, tool will use chunking, if `skip` and `first` are not provided in args
    // If false (default) tool will always use single query
    canUseChunking?: boolean
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
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
                sortBy: args.sortBy,
                first: args.first || DEFAULT_FIRST,
                skip: args.skip,
            }
        },
    },
    getIncidents: {
        name: 'getIncidents',
        query: GetIncidentsDocument,
        resultKey: 'incidents',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || DEFAULT_FIRST,
                sortBy: args.sortBy,
            }
        },
    },
    getOrganizationEmployees: {
        name: 'getOrganizationEmployees',
        query: GetContactEditorOrganizationEmployeesDocument,
        resultKey: 'employees',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
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
                first: args.first || DEFAULT_FIRST,
            }
        },
    },
    getTicketComments: {
        name: 'getTicketComments',
        query: GetTicketCommentsDocument,
        resultKey: 'ticketComments',
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
                first: args.first || DEFAULT_FIRST,
                skip: args.skip,
            }
        },
    },
    getContacts: {
        name: 'getContacts',
        query: GetContactForClientCardDocument,
        resultKey: 'contacts',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['createdAt_DESC'],
                first: args.first || DEFAULT_FIRST,
                skip: args.skip,
            }
        },
    },
    getNewsItems: {
        name: 'getNewsItems',
        query: GetNewsItemsForAiAssistantDocument,
        resultKey: 'newsItems',
        getGraphQLVariables: (args, userData) => {
            args = args || {}
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                sortBy: args.sortBy || ['publishedAt_DESC'],
                first: args.first || DEFAULT_FIRST,
                skip: args.skip,
            }
        },
    },
    getTicketWithDetails: {
        name: 'getTicketWithDetails',
        query: GetTicketWithDetailsForAiAssistantDocument,
        resultKey: null,
        getGraphQLVariables: (args, userData) => {
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
        const variables = config.getGraphQLVariables(args, userData)

        const shouldUseChunking = config.canUseChunking &&
            typeof args?.first !== 'number' &&
            typeof args?.skip !== 'number'

        let resultData: any

        if (!shouldUseChunking) {
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
            const chunkDelay = config.chunkDelay || DEFAULT_CHUNK_DELAY
            let maxIterations = Math.ceil(limit / size)

            console.log('using chunking')

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
                console.log(maxIterations, chunk.length, size, maxIterations > 1 || chunk.length !== size)
                if (maxIterations > 1 || chunk.length !== size) {
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
