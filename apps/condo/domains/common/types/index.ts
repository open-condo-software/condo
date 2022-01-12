/**
 *
 */
export type RecordWithAddressDetails = {
    property: {
        address: string
    }
    unitName?: string
}

/**
 * Describes an object containing a field called id, of string type
 */
export interface IRecordWithId extends Record<string, any> {
    id: string
}
