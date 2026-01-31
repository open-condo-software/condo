import { gql } from '@apollo/client'

// Pre-defined queries for different models that can be requested by AI
export const MODEL_QUERIES = {
    Ticket: gql`
        query fetchTickets($where: TicketWhereInput!, $first: Int) {
            items: allTickets(
                where: $where
                first: $first
            ) {
                id
                createdAt
                updatedAt
                status { name }
                details
                property { name address }
            }
        }
    `,
    TicketComment: gql`
        query fetchTicketComments($where: TicketCommentWhereInput!, $first: Int) {
            items: allTicketComments(
                where: $where
                first: $first
            ) {
                id
                createdAt
                updatedAt
                content
                ticket { id }
                user { id name }
            }
        }
    `,
    Property: gql`
        query fetchProperties($where: PropertyWhereInput!, $first: Int) {
            items: allProperties(
                where: $where
                first: $first
            ) {
                id
                createdAt
                updatedAt
                name
                address
                organization { id name }
            }
        }
    `,
    User: gql`
        query fetchUsers($where: UserWhereInput!, $first: Int) {
            items: allUsers(
                where: $where
                first: $first
            ) {
                id
                createdAt
                updatedAt
                name
                email
                phone
            }
        }
    `,
    // Add more models as needed
}

export const getModelQuery = (modelName: string) => {
    const query = MODEL_QUERIES[modelName]
    if (!query) {
        throw new Error(`Unsupported model for data fetching: ${modelName}`)
    }
    return query
}

export const SUPPORTED_MODELS = Object.keys(MODEL_QUERIES)
