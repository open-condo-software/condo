/**
 *
 */
export type RecordWithAddressDetails = {
    property: {
        address: string
    },
    unitName?: string
}

/**
 * Describes an object containing a field called id, of string type
 */
export interface IRecordWithId extends Record<string, any> {
    id: string,
}

type Only<T, U> = {
    [P in keyof T]: T[P]
} & {
    [P in keyof Omit<U, keyof T>]?: never
}

export type Either<T, U> = Only<T, U> | Only<U, T>