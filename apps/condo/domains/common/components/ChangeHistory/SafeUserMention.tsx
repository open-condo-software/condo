import { User } from '@app/condo/schema'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Tooltip } from '@condo/domains/common/components/Tooltip'


type SafeUserMentionBaseProps = {
    changeValue: {
        createdBy?: User
        changedByRole?: string
    }
}

export const SafeUserMention: React.FC<SafeUserMentionBaseProps> = ({ changeValue }) => {
    const intl = useIntl()
    const DeletedCreatedAtNoticeTitle = intl.formatMessage({ id: 'ticket.ticketChanges.notice.deletedCreatedAt.title' })
    const DeletedCreatedAtNoticeDescription = intl.formatMessage({ id: 'ticket.ticketChanges.notice.deletedCreatedAt.description' })

    return (
        changeValue.createdBy ? (
            <>
                {changeValue.changedByRole} {changeValue.createdBy.name}
            </>
        ) : (
            <Tooltip placement='top' title={DeletedCreatedAtNoticeDescription}>
                <span>{DeletedCreatedAtNoticeTitle}</span>
            </Tooltip>
        )
    )
}
