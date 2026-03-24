import { ApolloClient } from '@apollo/client'
import { GetContactEditorOrganizationEmployeesDocument, GetTicketsForAiAssistantDocument, GetIncidentsDocument, GetTicketCommentsDocument, GetPropertiesDocument, GetContactForClientCardDocument, GetNewsItemsForAiAssistantDocument, GetTicketWithDetailsForAiAssistantDocument } from '@app/condo/gql'

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
    resultKey: string
    getGraphQLVariables: (args: any, userData: UserData) => any
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
    getTickets: {
        name: 'getTickets',
        query: GetTicketsForAiAssistantDocument,
        resultKey: 'tickets',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 100,
                sortBy: args.sortBy,
                skip: args.skip || 0,
            }
        },
    },
    getIncidents: {
        name: 'getIncidents',
        query: GetIncidentsDocument,
        resultKey: 'incidents',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 10,
                sortBy: args.sortBy,
                skip: args.skip || 0,
            }
        },
    },
    getOrganizationEmployees: {
        name: 'getOrganizationEmployees',
        query: GetContactEditorOrganizationEmployeesDocument,
        resultKey: 'employees',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 50,
                skip: args.skip || 0,
                sortBy: args.sortBy || ['name_ASC'],
            }
        },
    },
    getProperties: {
        name: 'getProperties',
        query: GetPropertiesDocument,
        resultKey: 'properties',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 20,
                sortBy: args.sortBy,
                skip: args.skip || 0,
            }
        },
    },
    getTicketComments: {
        name: 'getTicketComments',
        query: GetTicketCommentsDocument,
        resultKey: 'ticketComments',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.ticket = { 
                    ...where.ticket,
                    organization: { id: userData.organizationId },
                }
            }
            return {
                where,
                first: args.first || 100,
                sortBy: args.sortBy || ['createdAt_DESC'],
                skip: args.skip || 0,
            }
        },
    },
    getContacts: {
        name: 'getContacts',
        query: GetContactForClientCardDocument,
        resultKey: 'contacts',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            if (args.where?.propertyId) {
                where.property = { id: args.where.propertyId }
            }
            return {
                where,
                first: args.first || 50,
                skip: args.skip || 0,
                sortBy: args.sortBy || ['name_ASC'],
            }
        },
    },
    getNewsItems: {
        name: 'getNewsItems',
        query: GetNewsItemsForAiAssistantDocument,
        resultKey: 'newsItems',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 100,
                sortBy: args.sortBy || ['publishedAt_DESC'],
                skip: args.skip || 0,
            }
        },
    },
    getTicketWithDetails: {
        name: 'getTicketWithDetails',
        query: GetTicketWithDetailsForAiAssistantDocument,
        resultKey: null,
        getGraphQLVariables: (args, userData) => {
            if (!args.id) {
                throw new Error('Ticket ID is required for getTicketWithDetails')
            }
            return {
                id: args.id,
            }
        },
    },
}

const runApolloQueryTool = async (
    config: ToolConfig,
    args: any,
    userData: UserData,
    client: ApolloClient<any>
): Promise<ToolCallResult> => {
    try {
        const variables = config.getGraphQLVariables(args, userData)
        
        const result = await client.query({
            query: config.query,
            variables,
            fetchPolicy: 'cache-first',
        })
        
        if (result.error) {
            throw result.error
        }
        
        if (result.errors && result.errors.length > 0) {
            throw new Error(result.errors.map(e => e.message).join(', '))
        }
        
        const data = result.data?.[config.resultKey] || []
        
        return {
            name: config.name,
            args,
            result: data,
        }
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

    // Right now we do not have any tools that would allow user to create / update data, so all tools are generic wrappers above apollo query 
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
