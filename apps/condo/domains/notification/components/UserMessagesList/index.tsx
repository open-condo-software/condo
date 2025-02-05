import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { isSSR } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Dropdown, Typography } from '@open-condo/ui'

import { usePollUserMessages } from '@condo/domains/notification/hooks/usePollUserMessages'
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

    const { userMessages } = usePollUserMessages({
        queryMessagesVariables: {
            userId,
            organizationId,
            types: messageTypesToFilter,
        },
        skipQueryMessagesCondition:
            !userId || !organizationId || !readUserMessagesAt || messageTypesToFilter.length === 0,
    })
    const newMessages = useMemo(() => userMessages.filter(message => message.createdAt > readUserMessagesAt), [readUserMessagesAt, userMessages])
    const viewedMessages = useMemo(() => userMessages.filter(message => message.createdAt <= readUserMessagesAt), [readUserMessagesAt, userMessages])

    useEffect(() => {
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
        if (isOpen) return

        // NOTE: when dropdown closes - update last read time
        const currentDate = new Date().toISOString()
        setReadUserMessagesAt(currentDate)

        userMessagesSettingsStorage.setReadUserMessagesAt(currentDate)
    }, [userMessagesSettingsStorage])

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
