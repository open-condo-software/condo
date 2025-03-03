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

import { useTracking } from '@condo/domains/common/components/TrackingContext'
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
    excludedMessageTypes: [],
    setExcludedMessageTypes: null,
})

export const useUserMessagesList = () => useContext(UserMessageListContext)

type UserMessagesListContextProviderProps = {
    children: ReactNode
}

export const UserMessagesListContextProvider: React.FC<UserMessagesListContextProviderProps> = ({ children }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [readUserMessagesAt, setReadUserMessagesAt] = useState<string>()
    const [excludedMessageTypes, setExcludedMessageTypes] = useState<Array<MessageTypeAllowedToFilterType>>([])

    const { user } = useAuth()
    const { organization } = useOrganization()
    const { logEvent } = useTracking()

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
        skipQueryMessagesCondition:
            !userId || !organizationId || allowedMessageTypesLoading || !readUserMessagesAt || messageTypesToFilter.length === 0,
    })

    const handleStorageChange = useCallback((event: StorageEvent) => {
        if (event.key === userMessagesSettingsStorage.getStorageKey()) {
            const lastReadUserMessagesAt = userMessagesSettingsStorage.getReadUserMessagesAt()
            if (!isEqual(lastReadUserMessagesAt, readUserMessagesAt)) {
                setReadUserMessagesAt(lastReadUserMessagesAt)
            }

            const excludedMessageTypesToFilter = userMessagesSettingsStorage.getExcludedUserMessagesTypes()
            if (!isEqual(excludedMessageTypesToFilter, excludedMessageTypes)) {
                setExcludedMessageTypes(excludedMessageTypesToFilter)
            }
        }
    }, [excludedMessageTypes, readUserMessagesAt, userMessagesSettingsStorage])

    useEffect(() => {
        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [handleStorageChange])

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
    }, [organizationId, userId, userMessagesSettingsStorage])

    const updateReadUserMessagesAt = useCallback(() => {
        const newestMessageCreatedAt = userMessages?.[0]?.createdAt

        if (new Date(newestMessageCreatedAt) > new Date(readUserMessagesAt)) {
            setReadUserMessagesAt(newestMessageCreatedAt)
            userMessagesSettingsStorage.setReadUserMessagesAt(newestMessageCreatedAt)
        }
    }, [readUserMessagesAt, userMessages, userMessagesSettingsStorage])

    const handleDropdownOpenChange = useCallback((isOpen: boolean) => {
        setIsDropdownOpen(isOpen)

        if (isOpen) {
            if (messagesListRef.current) {
                messagesListRef.current.scroll({ top: 0 })
            }
            logEvent({ eventName: 'UserMessagesListOpen' })
            return
        }

        // When dropdown closes - update last read time to createdAt of newest Message
        updateReadUserMessagesAt()
        clearLoadedMessages()
    }, [clearLoadedMessages, logEvent, messagesListRef, updateReadUserMessagesAt])


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
                excludedMessageTypes,
                setExcludedMessageTypes,
            }}
        >
            {children}
        </UserMessageListContext.Provider>
    )
}