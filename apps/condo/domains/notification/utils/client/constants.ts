import { GetUserMessagesQueryResult } from '@app/condo/gql'
import { MessageType } from '@app/condo/schema'


/**
 * Message types available for filtering in the UserMessagesList component
 */
export const USER_MESSAGE_TYPES_FILTER_ON_CLIENT = [
    MessageType.TicketCreated,
    MessageType.TicketCommentCreated,
    MessageType.PassTicketCreated,
] as const

type MessageTypeAllowedToFilterType = typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number]
export type MessageTypesAllowedToFilterType = MessageTypeAllowedToFilterType[]

export type UserMessageType = Omit<GetUserMessagesQueryResult['data']['messages'][number], 'type'> & {
    type: MessageTypeAllowedToFilterType
}