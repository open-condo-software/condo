import isEqual from 'lodash/isEqual'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { isSSR } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Dropdown, Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { useUserMessages } from '@condo/domains/notification/hooks/useUserMessages'
import { useUserMessagesListSettingsStorage } from '@condo/domains/notification/hooks/useUserMessagesListSettingsStorage'
import { USER_MESSAGE_TYPES_FILTER_ON_CLIENT } from '@condo/domains/notification/utils/client/constants'

import { MessageCard } from './MessageCard'
import { MessagesCounter } from './MessagesCounter'
import { UserMessagesSettingsModal } from './UserMessagesSettingsModal'

import './UserMessagesList.css'


export const UserMessagesList = () => {
    const intl = useIntl()
    const UserMessagesListTitle = intl.formatMessage({ id: 'notification.UserMessagesList.title' })
    const ViewedMessage = intl.formatMessage({ id: 'notification.UserMessagesList.viewed' })

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)
    const [readUserMessagesAt, setReadUserMessagesAt] = useState<string>()
    const [excludedMessageTypes, setExcludedMessageTypes] = useState<typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number][]>([])

    const { user } = useAuth()
    const { organization } = useOrganization()

    const userId = useMemo(() => user?.id, [user?.id])
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    const messageTypesToFilter = useMemo(
        () => USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(type => !excludedMessageTypes?.includes(type)),
        [excludedMessageTypes])

    const {
        userMessagesSettingsStorage,
    } = useUserMessagesListSettingsStorage()

    const {
        userMessages,
        messagesListRef,
        moreMessagesLoading,
        handleDropdownClose,
    } = useUserMessages({
        isDropdownOpen,
        messageTypesToFilter,
        skipQueryMessagesCondition:
            !userId || !organizationId || !readUserMessagesAt || messageTypesToFilter.length === 0,
    })
    const unreadMessages = useMemo(
        () => userMessages.filter(message => message.createdAt > readUserMessagesAt),
        [readUserMessagesAt, userMessages])
    const readMessages = useMemo(
        () => userMessages.filter(message => message.createdAt <= readUserMessagesAt),
        [readUserMessagesAt, userMessages])

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

    const handleModalOpen = useCallback(() => {
        setIsDropdownOpen(false)
        setSettingsModalOpen(true)
    }, [])

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

        handleDropdownClose()
    }, [handleDropdownClose, messagesListRef, readUserMessagesAt, userMessages, userMessagesSettingsStorage])

    return (
        <>
            <Dropdown
                open={isDropdownOpen}
                dropdownRender={() => (
                    <div className='user-messages-list' ref={messagesListRef}>
                        <div className='user-messages-list-header'>
                            <Typography.Title level={5}>
                                {UserMessagesListTitle}
                            </Typography.Title>
                            <div className='user-messages-list-settings-icon'>
                                <Settings onClick={handleModalOpen} />
                            </div>
                        </div>
                        {unreadMessages.map(message => <MessageCard key={message.id} message={message} />)}
                        {
                            readMessages.length > 0 && (
                                <>
                                    <Typography.Title level={6} type='secondary'>
                                        {ViewedMessage}
                                    </Typography.Title>
                                    {readMessages.map(message => <MessageCard key={message.id} message={message} viewed />)}
                                </>
                            )
                        }
                        {moreMessagesLoading && <Loader fill size='small' />}
                    </div>
                )}
                trigger={['hover']}
                onOpenChange={handleDropdownOpenChange}
                placement='bottomCenter'
            >
                <div>
                    <MessagesCounter count={unreadMessages.length}/>
                </div>
            </Dropdown>
            <UserMessagesSettingsModal
                open={settingsModalOpen}
                setOpen={setSettingsModalOpen}
                excludedMessageTypes={excludedMessageTypes}
                setExcludedMessageTypes={setExcludedMessageTypes}
            />
        </>
    )
}
