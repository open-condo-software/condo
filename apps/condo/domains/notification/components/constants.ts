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

/**
 * Message types which user excluded from USER_MESSAGE_TYPES_FILTER_ON_CLIENT.
 * If no organizationId or MESSAGE_TYPE in this object, then this type of notification is shown to the user.
 *
 * Structure:
 * {
 *     [organizationId]: ["MESSAGE_TYPE_1", "MESSAGE_TYPE_2"]
 * }
 */
export const EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY = 'excludedUserMessageTypes'

/**
 * Date and time when user read messages in specific organization.
 * Refreshes when user opens UserMessagesList dropdown in specific organization.
 * Relates to this value unread and read messages are displayed
 *
 * Structure:
 * {
 *     [organizationId]: datetime_iso_string
 * }
 */
export const READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY = 'readUserMessagesAt'

export type UserMessageType = Omit<GetUserMessagesQueryResult['data']['messages'][number], 'type'> & {
    type: typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number]
}

export const USER_MESSAGE_LIST_POLL_INTERVAL_IN_MS = 5 * 1000