import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { isSSR } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Dropdown, Typography } from '@open-condo/ui'

import {
    EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY,
    READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY, USER_MESSAGE_TYPES_FILTER_ON_CLIENT,
} from '@condo/domains/notification/components/constants'
import { usePollUserMessages } from '@condo/domains/notification/hooks/UserMessagesList/usePollUserMessages'

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
    const messageTypesToFilter = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(type => !excludedMessageTypes?.includes(type))

    const { userMessages } = usePollUserMessages({
        queryMessagesVariables: {
            userId,
            organizationId,
            types: messageTypesToFilter,
        },
        skipQueryMessagesCondition:
            !userId || !organizationId || !readUserMessagesAt || messageTypesToFilter.length === 0,
    })
    const newMessages = userMessages.filter(message => message.createdAt > readUserMessagesAt)
    const viewedMessages = userMessages.filter(message => message.createdAt <= readUserMessagesAt)

    useEffect(() => {
        if (isSSR()) return

        const readMessagesAtFromStorage = JSON.parse(localStorage.getItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY)) || {}
        const readMessagesAtForCurrentOrganization = readMessagesAtFromStorage[organizationId] ?
            readMessagesAtFromStorage[organizationId] :
            new Date().toISOString()
        setReadUserMessagesAt(readMessagesAtForCurrentOrganization)

        const excludedMessageTypesToFilter = JSON.parse(localStorage.getItem(EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY)) || {}
        const excludedMessageTypesForCurrentOrganization = excludedMessageTypesToFilter ?
            excludedMessageTypesToFilter[organizationId] :
            []
        setExcludedMessageTypes(excludedMessageTypesForCurrentOrganization)
    }, [organizationId])

    const handleModalOpen = useCallback(() => {
        setIsDropdownOpen(false)
        setSettingsModalOpen(true)
    }, [])

    const handleDropdownOpenChange = useCallback(async (isOpen) => {
        setIsDropdownOpen(isOpen)
        if (isOpen) return

        //NOTE: when dropdown closes - update last read time
        const currentDate = new Date().toISOString()
        setReadUserMessagesAt(currentDate)

        const storedReadMessagesAtData = JSON.parse(localStorage.getItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY)) || {}
        localStorage.setItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY, JSON.stringify({
            ...storedReadMessagesAtData,
            [organizationId]: currentDate,
        }))
    }, [organizationId])

    return (
        <>
            <Dropdown
                open={isDropdownOpen}
                dropdownRender={() => (
                    <div className='user-messages-list'>
                        <div className='user-messages-list-header'>
                            <Typography.Title level={5}>
                                {UserMessagesListTitle}
                            </Typography.Title>
                            <div className='user-messages-list-settings-icon'>
                                <Settings onClick={handleModalOpen} />
                            </div>
                        </div>
                        {newMessages.map(message => <MessageCard key={message.id} message={message} />)}
                        {
                            viewedMessages.length > 0 && (
                                <>
                                    <Typography.Title level={6} type='secondary'>
                                        {ViewedMessage}
                                    </Typography.Title>
                                    {viewedMessages.map(message => <MessageCard key={message.id} message={message} viewed />)}
                                </>
                            )
                        }
                    </div>
                )}
                trigger={['hover']}
                onOpenChange={handleDropdownOpenChange}
                placement='bottomCenter'
            >
                <div>
                    <MessagesCounter count={newMessages.length}/>
                </div>
            </Dropdown>
            <UserMessagesSettingsModal
                open={settingsModalOpen}
                setOpen={setSettingsModalOpen}
                setMessageTypesToFilter={setExcludedMessageTypes}
            />
        </>
    )
}
