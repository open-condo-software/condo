import { Maybe } from '@app/condo/schema'
import { ReactElement } from 'react'

export type BaseChangesType = {
    createdAt?: Maybe<string>
    actualCreationDate?: Maybe<string>
    id: string
}

export type UseChangedFieldMessagesOfType<ChangesType> = (changesValue: ChangesType) => Array<{
    field: string
    message: ReactElement | null
}>

export type HistoricalChangeInputType<ChangesType> = {
    changesValue: ChangesType
    useChangedFieldMessagesOf: UseChangedFieldMessagesOfType<ChangesType>
    labelSpan?: number
}

export type HistoricalChangeReturnType = ReactElement
