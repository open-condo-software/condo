import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { MessageTypeAllowedToFilterType, UserMessageType } from '@condo/domains/notification/utils/client/constants'

import './MessageCard.css'


type MessageCardProps = {
    message: UserMessageType
    viewed?: boolean
}

const MESSAGE_ICON: Record<MessageTypeAllowedToFilterType, string> = {
    PASS_TICKET_CREATED: '🔑',
    TICKET_COMMENT_CREATED: '✏️',
    TICKET_CREATED: '📬',
}

const DATE_FORMAT = 'DD.MM.YYYY, HH:mm'

export const MessageCard: React.FC<MessageCardProps> = ({ message, viewed }) => {
    const messageType = useMemo(() => message?.type, [message?.type])

    const intl = useIntl()
    const MessageTitle = intl.formatMessage({ id: `notification.UserMessagesList.message.${messageType}.label` })

    const { logEvent } = useTracking()

    const messageContent = useMemo(() => message?.defaultContent?.content, [message?.defaultContent?.content])
    const titleLink = useMemo(() => message?.meta?.data?.url, [message?.meta])
    const createdAt = useMemo(() => dayjs(message?.createdAt).format(DATE_FORMAT), [message?.createdAt])

    const handleLinkClick = useCallback(() => {
        logEvent({
            eventName: 'UserMessageCardClickTitle',
            eventProperties: { type: messageType, id: message?.id },
        })
    }, [logEvent, message?.id, messageType])

    return (
        <Card
            key={message.id}
            bodyPadding={12}
            className={`message-card${viewed ? ' message-card-viewed' : ''}`}
        >
            <div className='message-card-title'>
                <Typography.Link onClick={handleLinkClick} href={titleLink}>
                    {MessageTitle}
                </Typography.Link>
                {MESSAGE_ICON[message.type]}
            </div>
            <Typography.Paragraph type='secondary' size='medium'>
                {
                    messageContent.length > 100 ?
                        messageContent.slice(0, 100) + '…' :
                        messageContent
                }
            </Typography.Paragraph>
            <div className='message-card-footer'>
                <Typography.Paragraph type='secondary' size='small'>
                    {createdAt}
                </Typography.Paragraph>
            </div>
        </Card>
    )
}