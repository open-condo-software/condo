import classnames from 'classnames'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import Link from 'next/link'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import { analytics } from '@condo/domains/common/utils/analytics'
import { useUserMessagesList } from '@condo/domains/notification/contexts/UserMessagesListContext'
import { UserMessageType } from '@condo/domains/notification/utils/client/constants'

import styles from './MessageCard.module.css'

dayjs.extend(localizedFormat)

export type MessageCardProps = {
    message: UserMessageType
    viewed?: boolean
}

const MESSAGE_ICON: Record<UserMessageType['type'], string> = {
    PASS_TICKET_CREATED: '🔑',
    PASS_TICKET_COMMENT_CREATED: '✏️',
    TICKET_COMMENT_CREATED: '✏️',
    TICKET_CREATED: '📬',
    EMAIL_CONFIRMATION_CUSTOM_CLIENT_MESSAGE: '🕵🏻‍♀️',
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, viewed }) => {
    const messageType = useMemo(() => message?.type, [message?.type])

    const intl = useIntl()
    const MessageTitle = intl.formatMessage({ id: `notification.UserMessagesList.message.${messageType}.label` })

    const { setIsDropdownOpen } = useUserMessagesList()

    const messageContent = useMemo(() => message?.defaultContent?.content, [message?.defaultContent?.content])
    const titleLink = useMemo(() => message?.meta?.data?.url, [message?.meta])
    const createdAt = useMemo(() => dayjs(message?.createdAt).format('L, LT'), [message?.createdAt])

    const handleLinkClick = useCallback(() => {
        analytics.track('notification_view', { type: messageType, id: message?.id })
        setIsDropdownOpen(false)
    }, [message?.id, messageType, setIsDropdownOpen])

    const cardClassName = classnames(styles.messageCard, {
        [styles.messageCardViewed] : viewed,
    })

    return (
        <Card
            key={message.id}
            bodyPadding={12}
            className={cardClassName}
        >
            <div className={styles.messageCardTitle}>
                <Link href={titleLink}>
                    <Typography.Link onClick={handleLinkClick} href={titleLink}>
                        {MessageTitle}
                    </Typography.Link>
                </Link>
                {MESSAGE_ICON[message.type]}
            </div>
            <Typography.Paragraph type='secondary' size='medium'>
                {
                    messageContent.length > 100 ?
                        messageContent.slice(0, 100) + '…' :
                        messageContent
                }
            </Typography.Paragraph>
            <div className={styles.messageCardFooter}>
                <Typography.Paragraph type='secondary' size='small'>
                    {createdAt}
                </Typography.Paragraph>
            </div>
        </Card>
    )
}