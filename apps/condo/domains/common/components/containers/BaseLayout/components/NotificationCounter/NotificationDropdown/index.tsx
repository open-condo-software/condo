import React, { useCallback, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { Dropdown, Typography, Card, Modal, Button, Checkbox, Space } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { NotificationCounter } from '../index'

import './NotificationDropdown.css'


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
        className={`notification-card${message.viewed ? ' notification-card-viewed' : ''}`}
    >
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
            }}
            className='notification-card-title'
        >
            <Typography.Link>{message.title}</Typography.Link>
            {message.icon}
        </div>
        <div
            className='notification-card-body'
            style={{
                color: colors.gray[7],
                fontSize: '14px',
                fontWeight: 400,
            }}
        >
            {
                message.description.length > 100 ?
                    message.description.slice(0, 100) + '…' :
                    message.description
            }
        </div>
        <div
            className='notification-card-created-at'
            style={{
                color: colors.gray[7],
                float: 'right',
                fontSize: '12px',
                fontWeight: 400,
            }}
        >
            {message.time}
        </div>
    </Card>
)

export const NotificationDropdown = () => {
    const unreadMessages = notifications.filter(m => !m.viewed)
    const readMessages = notifications.filter(m => m.viewed)

    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)

    return (
        <>
            <Dropdown
                dropdownRender={() => (
                    <div
                        className='user-messages-dropdown'
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                            }}
                        >
                            <Typography.Title level={5}>Уведомления</Typography.Title>
                            <div style={{ color: colors.gray[7], cursor: 'pointer' }}>
                                <Settings
                                    onClick={() => setSettingsModalOpen(true)}
                                />
                            </div>
                        </div>

                        {unreadMessages.map(message => <MessageCard key={message.id} message={message} />)}

                        {
                            readMessages.length > 0 && (
                                <>
                                    <Typography.Title
                                        level={6}
                                        type='secondary'
                                    >
                                    Просмотренные
                                    </Typography.Title>
                                    {readMessages.map(message => <MessageCard key={message.id} message={message} />)}
                                </>
                            )
                        }
                    </div>
                )}
                trigger={['hover']}
                placement='bottomCenter'
            >
                <div>
                    <NotificationCounter count={unreadMessages.length} />
                </div>
            </Dropdown>
            <UserMessagesSettingsModal
                open={settingsModalOpen}
                setOpen={setSettingsModalOpen}
            />
        </>
    )
}
