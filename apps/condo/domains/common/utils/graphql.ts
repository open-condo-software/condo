import get from 'lodash/get'

import type { GraphQLError } from 'graphql'

type GraphQLErrorWithExtensions = GraphQLError & { extensions?: Record<string, unknown> }

const isGraphQLErrorWithExtensions = (value: unknown): value is GraphQLErrorWithExtensions => {
    return typeof value === 'object' && value !== null && 'extensions' in value
}

const normalizeGraphQLErrorsInput = (error: unknown): unknown[] => {
    if (!error) return []

    if (Array.isArray(error)) {
        return error
    }

    const graphQLErrors = get(error, 'graphQLErrors')
    if (Array.isArray(graphQLErrors)) {
        return graphQLErrors
    }

    return [error]
}

export const extractGraphQLErrorsWithExtensions = (error: unknown): GraphQLErrorWithExtensions[] => {
    return normalizeGraphQLErrorsInput(error).filter(isGraphQLErrorWithExtensions)
}

export type {
    GraphQLErrorWithExtensions,
}
