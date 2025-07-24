import isEqual from 'lodash/isEqual'
import React, {
    createContext,
    Dispatch, ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo, useRef,
    useState,
} from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { analytics } from '@condo/domains/common/utils/analytics'
import { useAllowedToFilterMessageTypes } from '@condo/domains/notification/hooks/useAllowedToFilterMessageTypes'
import { useUserMessages } from '@condo/domains/notification/hooks/useUserMessages'
import { useUserMessagesListSettingsStorage } from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import {
    MessageTypeAllowedToFilterType,
    UserMessageType,
} from '@condo/domains/notification/utils/client/constants'


type UserMessagesListContextType = {
    messagesListRef: ReturnType<typeof useRef<HTMLDivElement>>
    userMessages: Array<UserMessageType>
    readUserMessagesAt: string
    updateReadUserMessagesAt: () => void

    newMessagesLoading: boolean
    moreMessagesLoading: boolean

    isDropdownOpen: boolean
    setIsDropdownOpen: Dispatch<SetStateAction<boolean>>

    isNotificationSoundEnabled: boolean
    setIsNotificationSoundEnabled: Dispatch<SetStateAction<boolean>>

    excludedMessageTypes: Array<MessageTypeAllowedToFilterType>
    setExcludedMessageTypes: Dispatch<SetStateAction<Array<MessageTypeAllowedToFilterType>>>
}

const UserMessageListContext = createContext<UserMessagesListContextType>({
    messagesListRef: null,
    userMessages: [],
    readUserMessagesAt: null,
    updateReadUserMessagesAt: null,
    newMessagesLoading: false,
    moreMessagesLoading: false,
    isDropdownOpen: false,
    setIsDropdownOpen: null,
    isNotificationSoundEnabled: false,
    setIsNotificationSoundEnabled: null,
    excludedMessageTypes: [],
    setExcludedMessageTypes: null,
})

export const useUserMessagesList = () => useContext(UserMessageListContext)

const READ_USER_MESSAGES_AT_BROADCAST_CHANNEL = 'read-user-messages-at'

type UserMessagesListContextProviderProps = {
    children: ReactNode
    organizationIdsToFilter: Array<string>
}

export const UserMessagesListContextProvider: React.FC<UserMessagesListContextProviderProps> = ({ children, organizationIdsToFilter }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [readUserMessagesAt, setReadUserMessagesAt] = useState<string>()
    const [excludedMessageTypes, setExcludedMessageTypes] = useState<Array<MessageTypeAllowedToFilterType>>([])
    const [isNotificationSoundEnabled, setIsNotificationSoundEnabled] = useState<boolean>()

    const { user } = useAuth()
    const { organization } = useOrganization()

    const userId = useMemo(() => user?.id, [user?.id])
    const organizationId = useMemo(() => organization?.id, [organization?.id])

    const { messageTypes, loading: allowedMessageTypesLoading } = useAllowedToFilterMessageTypes()
    const messageTypesToFilter = useMemo(
        () => messageTypes.filter(type => !excludedMessageTypes?.includes(type)),
        [excludedMessageTypes, messageTypes])

    const {
        userMessagesSettingsStorage,
    } = useUserMessagesListSettingsStorage()

    const {
        userMessages, messagesListRef, clearLoadedMessages,
        moreMessagesLoading, newMessagesLoading,
    } = useUserMessages({
        isDropdownOpen,
        messageTypesToFilter,
        organizationIdsToFilter,
        skipQueryMessagesCondition:
            !userId || !organizationId || allowedMessageTypesLoading || !readUserMessagesAt ||
            messageTypesToFilter.length === 0 || organizationIdsToFilter.length === 0,
    })

    // Set initial settings to state
    useEffect(() => {
        let lastReadUserMessagesAt = userMessagesSettingsStorage.getReadUserMessagesAt()
        if (!lastReadUserMessagesAt) {
            lastReadUserMessagesAt = new Date().toISOString()
            userMessagesSettingsStorage.setReadUserMessagesAt(lastReadUserMessagesAt)
        }
        setReadUserMessagesAt(lastReadUserMessagesAt)

        const excludedMessageTypesToFilter = userMessagesSettingsStorage.getExcludedUserMessagesTypes()
        setExcludedMessageTypes(excludedMessageTypesToFilter)

        const isSoundEnabled = userMessagesSettingsStorage.getIsNotificationSoundEnabled()
        setIsNotificationSoundEnabled(isSoundEnabled)
    }, [organizationId, userId, userMessagesSettingsStorage])

    const { sendMessageToBroadcastChannel: sendReadUserMessagesAtToBroadcast } = useBroadcastChannel<string>(
        READ_USER_MESSAGES_AT_BROADCAST_CHANNEL,
        (newestMessageCreatedAt) => {
            setReadUserMessagesAt(newestMessageCreatedAt)
        }
    )

    const updateReadUserMessagesAt = useCallback(() => {
        const newestMessageCreatedAt = userMessages?.[0]?.createdAt

        if (new Date(newestMessageCreatedAt) > new Date(readUserMessagesAt)) {
            setReadUserMessagesAt(newestMessageCreatedAt)
            userMessagesSettingsStorage.setReadUserMessagesAt(newestMessageCreatedAt)
            sendReadUserMessagesAtToBroadcast(newestMessageCreatedAt)
        }
    }, [readUserMessagesAt, sendReadUserMessagesAtToBroadcast, userMessages, userMessagesSettingsStorage])

    const handleDropdownOpenChange = useCallback((isOpen: boolean) => {
        setIsDropdownOpen(isOpen)

        if (isOpen) {
            if (messagesListRef.current) {
                messagesListRef.current.scroll({ top: 0 })
            }

            analytics.track('notifications_list_view', {})

            return
        }

        // When dropdown closes - update last read time to createdAt of newest Message
        updateReadUserMessagesAt()
        clearLoadedMessages()
    }, [clearLoadedMessages, messagesListRef, updateReadUserMessagesAt])

    const handleIsNotificationSoundEnabledChange = useCallback((isEnabled: boolean) => {
        setIsNotificationSoundEnabled(isEnabled)
        userMessagesSettingsStorage.setIsNotificationSoundEnabled(isEnabled)
    }, [userMessagesSettingsStorage])

    return (
        <UserMessageListContext.Provider
            value={{
                messagesListRef,
                userMessages,
                readUserMessagesAt,
                updateReadUserMessagesAt,
                newMessagesLoading,
                moreMessagesLoading,
                isDropdownOpen,
                setIsDropdownOpen: handleDropdownOpenChange,
                isNotificationSoundEnabled,
                setIsNotificationSoundEnabled: handleIsNotificationSoundEnabledChange,
                excludedMessageTypes,
                setExcludedMessageTypes,
            }}
        >
            {children}
        </UserMessageListContext.Provider>
    )
}