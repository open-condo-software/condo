import { ApolloClient } from '@apollo/client'
import { GetContactEditorOrganizationEmployeesDocument, GetTicketsDocument, GetIncidentsDocument, GetTicketCommentsDocument, GetPropertiesDocument, GetContactForClientCardDocument } from '@app/condo/gql'

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
    resultMessageKey: string
    getGraphQLVariables: (args: any, userData: UserData) => any
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
    getTickets: {
        name: 'getTickets',
        query: GetTicketsDocument,
        resultKey: 'tickets',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 100,
                sortBy: args.sortBy,
            }
        },
    },
    getIncidents: {
        name: 'getIncidents',
        query: GetIncidentsDocument,
        resultKey: 'incidents',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (args, userData) => {
            const where = { ...args.where }
            if (userData.organizationId) {
                where.organization = { id: userData.organizationId }
            }
            return {
                where,
                first: args.first || 10,
                sortBy: args.sortBy,
            }
        },
    },
    getOrganizationEmployees: {
        name: 'getOrganizationEmployees',
        query: GetContactEditorOrganizationEmployeesDocument,
        resultKey: 'employees',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (_, userData) => ({
            where: { organization: { id: userData.organizationId } },
        }),
    },
    getProperties: {
        name: 'getProperties',
        query: GetPropertiesDocument,
        resultKey: 'properties',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (args, userData) => {
            const where = { organization: { id: userData.organizationId } }
            return {
                where: { ...where, ...args.where },
                first: args.first || 20,
                sortBy: args.sortBy,
            }
        },
    },
    getTicketComments: {
        name: 'getTicketComments',
        query: GetTicketCommentsDocument,
        resultKey: 'ticketComments',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (args) => ({
            ticketId: args.where?.ticketId,
        }),
    },
    getContacts: {
        name: 'getContacts',
        query: GetContactForClientCardDocument,
        resultKey: 'contacts',
        resultMessageKey: 'ai.chat.dataFetching',
        getGraphQLVariables: (args, userData) => {
            const where: any = {}
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
            resultMessage: {
                key: config.resultMessageKey,
            },
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
        
        const translatedMessage = intl 
            ? intl.formatMessage({ id: 'ai.chat.dataFetching' })
            : 'Collecting data...'
        
        return {
            ...result,
            resultMessage: translatedMessage,
        }
    }
    
    return result
}
