import { useGetUserMessagesCountQuery } from '@app/condo/gql'
import { MessageType } from '@condo/domains/schema'
import React, { useCallback, useEffect, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { isSSR } from '@open-condo/miniapp-utils'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Dropdown, Typography, Card } from '@open-condo/ui'

import {
    EXCLUDED_USER_MESSAGE_TYPES_LOCAL_STORAGE_KEY,
    READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY, USER_MESSAGE_TYPES_FILTER_ON_CLIENT,
} from '@condo/domains/notification/components/constants'

import { MessagesCounter } from './MessagesCounter'
import { UserMessagesSettingsModal } from './UserMessagesSettingsModal'


import './UserMessagesList.css'


const notifications = [
    {
        id: 1,
        title: 'Новая заявка',
        description: 'Уважаемая управляющая компания! Мы вас очень любим и бесконечно благодарны, но подскажите как мне что-то там сделать много текста',
        icon: '📩',
        time: '07.12.2024, 12:44',
        viewed: false,
    },
    {
        id: 2,
        title: 'Оформлен пропуск',
        description: 'Иванов Константин Константи… придет 27 октября 2024 текст текст текст текст',
        icon: '🔑',
        time: '07.12.2024, 12:44',
        viewed: false,
    },
    {
        id: 3,
        title: 'Новый комментарий',
        description: 'Вы ничего не сделали, а статус заявки сменился на Выполнена текст текст текст текст текст текст текст текст текст текст текст текст текст текст текст текст',
        icon: '✏️',
        time: '07.12.2024, 12:44',
        viewed: true,
    },
    {
        id: 11,
        title: 'Новая заявка',
        description: 'Уважаемая управляющая компания! Мы вас очень любим и бесконечно благодарны, но подскажите текст текст текст текст текст текст текст текст текст текст текст текст',
        icon: '📩',
        time: '07.12.2024, 12:44',
        viewed: false,
    },
    {
        id: 22,
        title: 'Оформлен пропуск',
        description: 'Иванов Константин Константи… придет 27 октября 2024 текст текст текст текст текст текст текст текст текст текст текст текст текст текст текст текст',
        icon: '🔑',
        time: '07.12.2024, 12:44',
        viewed: false,
    },
    {
        id: 33,
        title: 'Новый комментарий',
        description: 'Вы ничего не сделали, а статус заявки сменился на Выполнена',
        icon: '✏️',
        time: '07.12.2024, 12:44',
        viewed: true,
    },
]

const MessageCard = ({ message }) => (
    <Card
        key={message.id}
        bodyPadding={12}
        className={`message-card${message.viewed ? ' message-card-viewed' : ''}`}
    >
        <div className='message-card-title'>
            <Typography.Link>{message.title}</Typography.Link>
            {message.icon}
        </div>
        <Typography.Text type='secondary' size='medium'>
            {
                message.description.length > 100 ?
                    message.description.slice(0, 100) + '…' :
                    message.description
            }
        </Typography.Text>
        <div className='message-card-footer'>
            <Typography.Text type='secondary' size='small'>
                {message.time}
            </Typography.Text>
        </div>
    </Card>
)

export const UserMessagesList = () => {
    const intl = useIntl()
    const UserMessagesListTitle = intl.formatMessage({ id: 'notification.UserMessagesList.title' })
    const ViewedMessage = intl.formatMessage({ id: 'notification.UserMessagesList.viewed' })

    const { user } = useAuth()
    const { organization } = useOrganization()

    const userId = user?.id
    const organizationId = organization?.id

    const unreadMessages = notifications.filter(m => !m.viewed)
    const readMessages = notifications.filter(m => m.viewed)

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)
    const [readUserMessagesAt, setReadUserMessagesAt] = useState<string>()
    const [excludedMessageTypes, setExcludedMessageTypes] = useState<MessageType[]>([])

    const messageTypesToFilter = USER_MESSAGE_TYPES_FILTER_ON_CLIENT.filter(type => !excludedMessageTypes?.includes(type))

    console.log('readUserMessagesAt', readUserMessagesAt)
    console.log('excludedMessageTypes', excludedMessageTypes)

    const { data } = useGetUserMessagesCountQuery({
        variables: {
            userId,
            organizationId,
            types: messageTypesToFilter,
            lastReadMessagesAt: readUserMessagesAt,
        },
        pollInterval: 5 * 1000,
        skip: !userId || !organizationId || messageTypesToFilter.length === 0,
    })
    const userMessagesCount = data?.result?.count

    useEffect(() => {
        if (isSSR()) return

        const readMessagesAtFromStorage = JSON.parse(localStorage.getItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY)) || {}
        let readMessagesAtForCurrentOrganization = readMessagesAtFromStorage[organizationId]

        if (!readMessagesAtForCurrentOrganization) {
            readMessagesAtForCurrentOrganization = new Date().toISOString()
        }

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

    const handleDropdownOpenChange = useCallback((isOpen) => {
        setIsDropdownOpen(isOpen)

        // when dropdown opens - update last read date for specific organization in localStorage
        // when dropdown closes - update state used in query filter, so the next query will use last open dropdown datetime in filter
        if (isOpen) {
            const currentDate = new Date().toISOString()
            const storedData = JSON.parse(localStorage.getItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY)) || {}
            const updatedData = {
                ...storedData,
                [organizationId]: currentDate,
            }

            localStorage.setItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY, JSON.stringify(updatedData))
        } else {
            const readUserMessagesAtFromStorage = JSON.parse(localStorage.getItem(READ_USER_MESSAGES_AT_LOCAL_STORAGE_KEY)) || {}
            const valueForCurrentOrganization = readUserMessagesAtFromStorage[organizationId]

            setReadUserMessagesAt(valueForCurrentOrganization ? valueForCurrentOrganization : new Date().toISOString())
        }
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
                        {unreadMessages.map(message => <MessageCard key={message.id} message={message} />)}
                        {
                            readMessages.length > 0 && (
                                <>
                                    <Typography.Title level={6} type='secondary'>
                                        {ViewedMessage}
                                    </Typography.Title>
                                    {readMessages.map(message => <MessageCard key={message.id} message={message} />)}
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
                    <MessagesCounter count={userMessagesCount} />
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
