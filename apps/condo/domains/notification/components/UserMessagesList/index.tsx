import React, { useCallback, useMemo, useState } from 'react'

import { Settings } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Dropdown, Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { useUserMessagesList } from '@condo/domains/notification/contexts/UserMessagesListContext'
import { useNewMessageTitleNotification } from '@condo/domains/notification/hooks/useNewMessageTitleNotification'

import { MessageCard as DefaultMessageCard, MessageCardProps } from './MessageCard'
import { MessagesCounter } from './MessagesCounter'
import styles from './UserMessagesList.module.css'
import { UserMessagesSettingsModal } from './UserMessagesSettingsModal'


type UserMessagesListProps = {
    MessageCard?: React.FC<MessageCardProps>
}

export const UserMessagesList: React.FC<UserMessagesListProps> = ({ MessageCard = DefaultMessageCard }) => {
    const intl = useIntl()
    const UserMessagesListTitle = intl.formatMessage({ id: 'notification.UserMessagesList.title' })
    const ViewedMessage = intl.formatMessage({ id: 'notification.UserMessagesList.viewed' })
    const EmptyListMessage = intl.formatMessage({ id: 'notification.UserMessagesList.emptyList' })

    const { breakpoints } = useLayoutContext()

    const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false)

    const {
        messagesListRef,
        userMessages,
        readUserMessagesAt,

        newMessagesLoading,
        moreMessagesLoading,

        isDropdownOpen,
        setIsDropdownOpen,

        excludedMessageTypes,
        setExcludedMessageTypes,
    } = useUserMessagesList()

    const handleModalOpen = useCallback(() => {
        setIsDropdownOpen(false)
        setSettingsModalOpen(true)
    }, [setIsDropdownOpen, setSettingsModalOpen])

    const unreadMessages = useMemo(
        () => userMessages?.filter(message => message.createdAt > readUserMessagesAt),
        [readUserMessagesAt, userMessages])
    const readMessages = useMemo(
        () => userMessages?.filter(message => message.createdAt <= readUserMessagesAt),
        [readUserMessagesAt, userMessages])

    useNewMessageTitleNotification(unreadMessages?.length)

    const emptyPlaceholder = useMemo(() => (
        <BasicEmptyListView image='/dino/searching@2x.png'>
            <Typography.Title level={5}>{EmptyListMessage}</Typography.Title>
        </BasicEmptyListView>
    ), [EmptyListMessage])

    const messagesListContent = useMemo(() => {
        if (!newMessagesLoading && userMessages?.length === 0) {
            return emptyPlaceholder
        }

        return (
            <>
                {
                    userMessages?.length === 0 && !newMessagesLoading && (
                        <BasicEmptyListView />
                    )
                }
                {unreadMessages?.map(message => <MessageCard key={message.id} message={message} />)}
                {
                    readMessages?.length > 0 && (
                        <>
                            <Typography.Title level={6} type='secondary'>
                                {ViewedMessage}
                            </Typography.Title>
                            {readMessages?.map(message => <MessageCard key={message.id} message={message} viewed />)}
                        </>
                    )
                }
                {moreMessagesLoading && <Loader fill size='small' />}
            </>
        )
    }, [ViewedMessage, emptyPlaceholder, moreMessagesLoading, newMessagesLoading, readMessages, unreadMessages, userMessages?.length])

    return (
        <>
            <Dropdown
                mouseLeaveDelay={0.5}
                open={isDropdownOpen}
                dropdownRender={() => (
                    <div className={styles.userMessagesList} ref={messagesListRef}>
                        <div className={styles.userMessagesListHeader}>
                            <Typography.Title level={5}>
                                {UserMessagesListTitle}
                            </Typography.Title>
                            <div className={styles.userMessagesListSettingsIcon}>
                                <Settings onClick={handleModalOpen} />
                            </div>
                        </div>
                        {messagesListContent}
                    </div>
                )}
                overlayClassName={!breakpoints.TABLET_LARGE && styles.userMessagesListMobileOverlay}
                trigger={['hover']}
                onOpenChange={setIsDropdownOpen}
                placement='bottomCenter'
            >
                <div>
                    <MessagesCounter count={unreadMessages?.length}/>
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
