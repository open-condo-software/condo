import { Typography } from 'antd'
import { get } from 'lodash'
import { useMemo } from 'react'

import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { CLOSED_STATUS_TYPE, REVIEW_VALUES } from '@condo/domains/ticket/constants'
import { getReviewMessageByValue } from '@condo/domains/ticket/utils/clientSchema/Ticket'

type TicketReviewFieldProps = {
    ticket: Ticket
}

export const TicketReviewField: React.FC<TicketReviewFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ReviewValueMessage = intl.formatMessage({ id: 'ticket.reviewValue' })
    const ReviewWithoutCommentMessage = intl.formatMessage({ id: 'ticket.reviewComment.withoutComment' })
    const NoReviewMessage = intl.formatMessage({ id: 'ticket.reviewValue.noReview' })

    const ticketReviewValue = useMemo(() => get(ticket, 'reviewValue'), [ticket])
    const ticketReviewComment = useMemo(() => get(ticket, 'reviewComment'), [ticket])
    const reviewValueToText = useMemo(() => ({
        [REVIEW_VALUES.BAD]: `${getReviewMessageByValue(REVIEW_VALUES.BAD, intl)} 😔`,
        [REVIEW_VALUES.GOOD]: `${getReviewMessageByValue(REVIEW_VALUES.GOOD, intl)} 😊`,
    }), [intl])
    const ticketStatusType = useMemo(() => get(ticket, ['status', 'type']), [ticket])

    return ticketStatusType === CLOSED_STATUS_TYPE ? (
        <PageFieldRow title={ReviewValueMessage} ellipsis>
            <Typography.Text>
                {
                    ticketReviewValue ? (
                        <>
                            {reviewValueToText[ticketReviewValue]}&nbsp;
                            <Typography.Text type={'secondary'}>
                                ({ticketReviewComment ? ticketReviewComment.replace(';', ', ') : ReviewWithoutCommentMessage})
                            </Typography.Text>
                        </>
                    ) : (
                        <Typography.Text type={'secondary'}>
                            {NoReviewMessage}
                        </Typography.Text>
                    )
                }
            </Typography.Text>
        </PageFieldRow>
    ) : null
}