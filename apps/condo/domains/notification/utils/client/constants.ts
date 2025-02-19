import { GetUserMessagesQueryResult } from '@app/condo/gql'
import { MessageType } from '@app/condo/schema'


export const CONDO_MESSAGE_TYPES = [
    MessageType.TicketCreated,
    MessageType.TicketCommentCreated,
] as const

export const B2B_APP_MESSAGE_TYPES = [
    MessageType.PassTicketCreated,
] as const

/**
 * Message types available for filtering in the UserMessagesList component
 */
const USER_MESSAGE_TYPES_FILTER_ON_CLIENT = [
    ...CONDO_MESSAGE_TYPES,
    ...B2B_APP_MESSAGE_TYPES,
] as const

export type MessageTypeAllowedToFilterType = typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number]

export type UserMessageType = Omit<GetUserMessagesQueryResult['data']['messages'][number], 'type'> & {
    type: MessageTypeAllowedToFilterType
}