/**
 * Frontend mirror of extractWhereComplexityFactor from
 * packages/keystone/apolloServerPlugins/rateLimiting/query.utils.js
 *
 * Used to estimate _allTicketsMeta query complexity before sending it,
 * so we can hide counts in getTicketsCountersByStatus when it would be too expensive.
 * The limit is configured via the ticket-status-counters-limit feature flag (number).
 */

const WHERE_SCALING_FACTOR = 2
const WHERE_PAGE_LIMIT = 100
const WHERE_MAX_TOTAL_RESULTS = 1000
const WHERE_QUERY_WEIGHT = 2
// getTicketsCountersByStatus fires one _allTicketsMeta per status type
const STATUS_QUERY_COUNT = 6

function extractWhereComplexityFactor (where: Record<string, unknown>): number {
    const fieldsComplexity = Object.entries(where).reduce<number>((acc, [fieldName, fieldValue]) => {
        if (Array.isArray(fieldValue)) {
            if (fieldName === 'AND' || fieldName === 'OR') {
                return acc + fieldValue.reduce(
                    (total: number, item) => total + extractWhereComplexityFactor(item as Record<string, unknown>),
                    0
                )
            } else if (fieldName.endsWith('_in')) {
                return acc + Math.ceil(fieldValue.length / WHERE_PAGE_LIMIT)
            }
            return acc
        } else if (typeof fieldValue === 'object' && fieldValue !== null) {
            return acc + WHERE_SCALING_FACTOR * extractWhereComplexityFactor(fieldValue as Record<string, unknown>)
        }
        return acc
    }, 0)
    return Math.max(1, fieldsComplexity)
}

export function estimateTicketCountersComplexity (where: Record<string, unknown>): number {
    const maxPaginationFactor = Math.ceil(WHERE_MAX_TOTAL_RESULTS / WHERE_PAGE_LIMIT)
    return STATUS_QUERY_COUNT * WHERE_QUERY_WEIGHT * extractWhereComplexityFactor(where) * maxPaginationFactor
}
