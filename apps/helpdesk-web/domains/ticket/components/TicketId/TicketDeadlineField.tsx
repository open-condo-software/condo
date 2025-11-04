import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    getDeadlineType,
    getHumanizeDeadlineDateDifference,
    isCompletedTicket,
    TicketDeadlineType,
} from '@app/condo/domains/ticket/utils/helpers'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDeadlineFieldProps = {
    ticket: Ticket
}

export const TicketDeadlineField: React.FC<TicketDeadlineFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const Deadline = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const ToCompleteMessage = intl.formatMessage({ id: 'ticket.deadline.ToComplete' }).toLowerCase()
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' }).toLowerCase()
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' }).toLowerCase()
    const CompletedEarlierMessage = intl.formatMessage({ id: 'ticket.deadline.CompletedEarlier' }).toLowerCase()
    const CompletedLessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.CompletedLessThenDay' }).toLowerCase()
    const CompletedLateMessage = intl.formatMessage({ id: 'ticket.deadline.CompletedLate' }).toLowerCase()

    const ticketDeadline = ticket.deadline ? dayjs(ticket.deadline) : null
    const getTicketDeadlineMessage = useCallback(() => {
        if (!ticketDeadline) return

        const isCompleted = isCompletedTicket(ticket)
        const deadlineType = getDeadlineType(ticket)
        const { dayDiff, overdueDiff } = getHumanizeDeadlineDateDifference(ticket)

        switch (deadlineType) {
            case TicketDeadlineType.MORE_THAN_DAY: {
                return (
                    <Typography.Text type='warning' strong>
                        ({isCompleted ? CompletedEarlierMessage.replace('{days}', dayDiff) : ToCompleteMessage.replace('{days}', dayDiff)})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.LESS_THAN_DAY: {
                return (
                    <Typography.Text type='warning' strong>
                        ({isCompleted ? CompletedLessThenDayMessage : LessThenDayMessage})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.OVERDUE: {
                return (
                    <Typography.Text type='danger' strong>
                        ({isCompleted ? CompletedLateMessage.replace('{days}', overdueDiff) : OverdueMessage.replace('{days}', overdueDiff)})
                    </Typography.Text>
                )
            }
        }

    }, [CompletedEarlierMessage, CompletedLateMessage, CompletedLessThenDayMessage, LessThenDayMessage, OverdueMessage, ToCompleteMessage, ticket, ticketDeadline])

    const overdueMessage = useMemo(() => getTicketDeadlineMessage(),
        [getTicketDeadlineMessage])

    return ticketDeadline ? (
        <PageFieldRow title={Deadline} ellipsis={{ rows: 2 }}>
            <Typography.Text strong> {dayjs(ticketDeadline).format('DD MMMM YYYY')} </Typography.Text>
            {overdueMessage}
        </PageFieldRow>
    ) : null
}