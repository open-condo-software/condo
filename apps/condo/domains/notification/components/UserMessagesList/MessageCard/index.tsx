import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import './MessageCard.css'
import { USER_MESSAGE_TYPES_FILTER_ON_CLIENT, UserMessageType } from '@condo/domains/notification/utils/client/constants'


type MessageCardProps = {
    message: UserMessageType
    viewed?: boolean
}

const MESSAGE_ICON: Record<typeof USER_MESSAGE_TYPES_FILTER_ON_CLIENT[number], string> = {
    PASS_TICKET_CREATED: '🔑',
    TICKET_COMMENT_CREATED: '✏️',
    TICKET_CREATED: '📬',
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, viewed }) => {
    const intl = useIntl()
    const MessageTitle = intl.formatMessage({ id: `notification.UserMessagesList.message.${message.type}.label` })

    const messageContent = useMemo(() => message?.defaultContent?.content, [message?.defaultContent?.content])
    const titleLink = useMemo(() => message?.meta?.data?.url, [message?.meta])

    return (
        <Card
            key={message.id}
            bodyPadding={12}
            className={`message-card${viewed ? ' message-card-viewed' : ''}`}
        >
            <div className='message-card-title'>
                <Typography.Link href={titleLink}>{MessageTitle}</Typography.Link>
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
                    {message.createdAt}
                </Typography.Paragraph>
            </div>
        </Card>
    )
}