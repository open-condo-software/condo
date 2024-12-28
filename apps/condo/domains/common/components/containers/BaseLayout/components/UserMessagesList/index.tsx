import React, { useCallback, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { Dropdown, Typography, Card, Modal, Button, Checkbox, Space } from '@open-condo/ui'

import { MessagesCounter } from './MessagesCounter'

import './UserMessagesList.css'


const UserMessagesSettingsModal = ({ open, setOpen }) => {
    const handleSubmit = useCallback(() => {
        // update or set value in local storage
        setOpen(false)
    }, [setOpen])

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            title='Какие уведомления показывать?'
            footer={(
                <Button type='primary' onClick={handleSubmit}>
                    Сохранить изменения
                </Button>
            )}
        >
            <Space size={12} direction='vertical'>
                <Checkbox label='О новых заявках' />
                <Checkbox label='О новых комментариях' />
                <Checkbox label='Об оформленных пропусках' />
            </Space>
        </Modal>
    )
}

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
    const unreadMessages = notifications.filter(m => !m.viewed)
    const readMessages = notifications.filter(m => m.viewed)

    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)

    const handleModalOpen = useCallback(() => {
        setIsDropdownOpen(false)
        setSettingsModalOpen(true)
    }, [])

    return (
        <>
            <Dropdown
                open={isDropdownOpen}
                dropdownRender={() => (
                    <div className='user-messages-list'>
                        <div className='user-messages-list-header'>
                            <Typography.Title level={5}>Уведомления</Typography.Title>
                            <Typography.Text type='secondary'>
                                <Settings onClick={handleModalOpen}/>
                            </Typography.Text>
                        </div>

                        {unreadMessages.map(message => <MessageCard key={message.id} message={message} />)}

                        {
                            readMessages.length > 0 && (
                                <>
                                    <Typography.Title level={6} type='secondary'>
                                        Просмотренные
                                    </Typography.Title>
                                    {readMessages.map(message => <MessageCard key={message.id} message={message} />)}
                                </>
                            )
                        }
                    </div>
                )}
                trigger={['hover']}
                onOpenChange={(open) => setIsDropdownOpen(open)}
                placement='bottomCenter'
            >
                <div>
                    <MessagesCounter count={5} />
                </div>
            </Dropdown>
            <UserMessagesSettingsModal
                open={settingsModalOpen}
                setOpen={setSettingsModalOpen}
            />
        </>
    )
}
