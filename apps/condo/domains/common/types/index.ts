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
 * Converts generic string literal union to a type, so that any member of a union can be used as a generic record key
 * ex.: StringLiteral<'aaa' | 'bbb' | 'ccc'> => ... => record.aaa
 * ex.: type TableMessageKeys = 'NameMessage' | 'PhoneMessage' | 'EmailMessage' | 'AddressMessage' | 'ShortFlatNumber'
 */
export type StringLiteral<T> = T extends `${string & T}` ? T : never
/**
 * Generic record type for message set meta data. Used to generate intl messages set
 * Here T is a string literal union (see type StringLiteral description above)
 *
 * ex.:
 *     const TABLE_MESSAGES: MessageSetMeta<TableMessageKeys> = {
 *         NameMessage: 'field.FullName.short',
 *         PhoneMessage: 'Phone',
 *         EmailMessage: 'field.EMail',
 *         AddressMessage: 'pages.condo.property.field.Address',
 *         ShortFlatNumber: 'field.FlatNumber',
 *     }
 */
export type MessageSetMeta<T> = Record<StringLiteral<T>, string>
/**
 * Generic record type for generated intl messages set
 */
export type IntlMessages<T> = Record<StringLiteral<T>, string>
export type PartialIntlMessages<T> = Partial<IntlMessages<T>>

/**
 * Describes an object containing a field called id, of string type
 */
export interface IRecordWithId extends Record<string, any> {
    id: string,
}