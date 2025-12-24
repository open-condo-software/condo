import { GetUserMessagesQueryResult } from '@app/condo/gql'
import { MessageType } from '@app/condo/schema'


export const CONDO_MESSAGE_TYPES = [
    MessageType.TicketCreated,
    MessageType.TicketCommentCreated,
] as const

export const B2B_APP_MESSAGE_TYPES = [
    MessageType.PassTicketCreated,
    MessageType.PassTicketCommentCreated,
] as const

/**
 * Message types available for filtering in the UserMessagesList component
 */
export const USER_MESSAGE_TYPES_FILTER_ON_CLIENT = [
    ...CONDO_MESSAGE_TYPES,
    ...B2B_APP_MESSAGE_TYPES,
] as const

export type MessageTypeAllowedToFilterType = typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number]

/**
 * Custom messages are generated in the frontend and displayed in the UserMessagesList with specific logic
 */
export const EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE_TYPE = 'EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE'
export const SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE = 'SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE'
export type CustomClientMessageTypes = typeof EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE_TYPE | typeof SUBSCRIPTION_EXPIRATION_CUSTOM_CLIENT_MESSAGE_TYPE

export type UserMessageType = Omit<GetUserMessagesQueryResult['data']['messages'][number], 'type'> & {
    type: MessageTypeAllowedToFilterType | CustomClientMessageTypes
    customTitle?: string
}