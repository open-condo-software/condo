import * as Types from '@app/condo/schema'

export type AuthenticatedUserQueryVariables = Types.Exact<{ [key: string]: never }>


export type AuthenticatedUserQuery = { __typename?: 'Query', authenticatedUser?: { __typename?: 'User', id: string, name?: string | null, type?: Types.UserTypeType | null } | null }
