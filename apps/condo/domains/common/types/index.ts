import type { AuthenticatedUserQueryResult, GetActiveOrganizationEmployeeQueryResult } from '@app/condo/gql'
import type { GetPrefetchedData } from '@condo/domains/common/utils/next/types'
import type { NextPageContext } from 'next'
import type { FC, PropsWithChildren } from 'react'


/**
 * Describes an object containing a field called id, of string type
 */
export interface IRecordWithId extends Record<string, any> {
    id: string
}

type Only<T, U> = {
    [P in keyof T]: T[P]
} & {
    [P in keyof Omit<U, keyof T>]?: never
}

export type Either<T, U> = Only<T, U> | Only<U, T>

type UserType = AuthenticatedUserQueryResult['data']['authenticatedUser'] | null
type ActiveEmployeeType = GetActiveOrganizationEmployeeQueryResult['data']['employees'][number] | null
export type PageComponentType <Props = Record<string, never>> = FC<Props> & {
    isError?: boolean
    container?: FC<PropsWithChildren>
    headerAction?: JSX.Element
    requiredAccess?: FC
    skipUserPrefetch?: boolean
    skipRedirectToAuth?: boolean
    getPrefetchedData?: GetPrefetchedData<UserType, ActiveEmployeeType>
    getInitialProps?: (context: NextPageContext) => Promise<Record<string, any>>
}
