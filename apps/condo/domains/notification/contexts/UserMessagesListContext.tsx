import isEqual from 'lodash/isEqual'
import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo, useRef,
    useState,
} from 'react'

import { isSSR } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { useUserMessages } from '@condo/domains/notification/hooks/useUserMessages'
import { useUserMessagesListSettingsStorage } from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import {
    MessageTypesAllowedToFilterType,
    UserMessageType,
} from '@condo/domains/notification/utils/client/constants'

import { useAllowedToFilterMessageTypes } from '../hooks/useAllowedToFilterMessageTypes'


type UserMessagesListContextType = {
    messagesListRef: ReturnType<typeof useRef<HTMLDivElement>>
    userMessages: UserMessageType[]
    readUserMessagesAt: string

    newMessagesLoading: boolean
    moreMessagesLoading: boolean

    isDropdownOpen: boolean
    setIsDropdownOpen: Dispatch<SetStateAction<boolean>>

    excludedMessageTypes: MessageTypesAllowedToFilterType
    setExcludedMessageTypes: Dispatch<SetStateAction<MessageTypesAllowedToFilterType>>
}

const UserMessageListContext = createContext<UserMessagesListContextType>({
    messagesListRef: null,
    userMessages: [],
    readUserMessagesAt: null,
    newMessagesLoading: false,
    moreMessagesLoading: false,
    isDropdownOpen: false,
    setIsDropdownOpen: null,
    excludedMessageTypes: [],
    setExcludedMessageTypes: null,
})

export const useUserMessagesList = () => useContext(UserMessageListContext)

export const UserMessagesListContextProvider = ({ children }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [readUserMessagesAt, setReadUserMessagesAt] = useState<string>()
    const [excludedMessageTypes, setExcludedMessageTypes] = useState<MessageTypesAllowedToFilterType>([])

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
        userMessages,
        messagesListRef,
        moreMessagesLoading,
        clearLoadedMessages,
        newMessagesLoading,
    } = useUserMessages({
        isDropdownOpen,
        messageTypesToFilter,
        skipQueryMessagesCondition:
            !userId || !organizationId || allowedMessageTypesLoading || !readUserMessagesAt || messageTypesToFilter.length === 0,
    })

    const handleStorageChange = useCallback((event) => {
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
        if (isSSR()) return
        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [handleStorageChange])

    useEffect(() => {
        // Set initial settings to state
        if (isSSR()) return

        let lastReadUserMessagesAt = userMessagesSettingsStorage.getReadUserMessagesAt()
        if (!lastReadUserMessagesAt) {
            lastReadUserMessagesAt = new Date().toISOString()
            userMessagesSettingsStorage.setReadUserMessagesAt(lastReadUserMessagesAt)
        }
        setReadUserMessagesAt(lastReadUserMessagesAt)

        const excludedMessageTypesToFilter = userMessagesSettingsStorage.getExcludedUserMessagesTypes()
        setExcludedMessageTypes(excludedMessageTypesToFilter)
    }, [organizationId, userId, userMessagesSettingsStorage])

    const handleDropdownOpenChange = useCallback(async (isOpen) => {
        setIsDropdownOpen(isOpen)

        if (isOpen) {
            if (messagesListRef.current) {
                messagesListRef.current.scroll({ top: 0 })
            }

            return
        }

        // When dropdown closes - update last read time to createdAt of newest Message
        const newestMessageCreatedAt = userMessages?.[0]?.createdAt
        if (new Date(newestMessageCreatedAt) > new Date(readUserMessagesAt)) {
            setReadUserMessagesAt(newestMessageCreatedAt)
            userMessagesSettingsStorage.setReadUserMessagesAt(newestMessageCreatedAt)
        }

        clearLoadedMessages()
    }, [clearLoadedMessages, messagesListRef, readUserMessagesAt, userMessages, userMessagesSettingsStorage])

    return (
        <UserMessageListContext.Provider
            value={{
                messagesListRef,
                userMessages,
                readUserMessagesAt,
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