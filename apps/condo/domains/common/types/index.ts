import type { GetPrefetchedData } from '@condo/domains/common/utils/next/types'
import type { NextPageContext } from 'next'
import type { FC } from 'react'


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

export type PageComponentType <Props = Record<string, never>> = FC<Props> & {
    isError?: boolean
    container?: React.FC
    headerAction?: JSX.Element
    requiredAccess?: FC
    skipUserPrefetch?: boolean
    preventRedirectToAuth?: boolean
    getPrefetchedData?: GetPrefetchedData
    getInitialProps?: (context: NextPageContext) => Promise<Record<string, any>>
}
