import { Typography } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { getDeadlineType, getHumanizeDeadlineDateDifference, TicketDeadlineType } from '@app/condo/domains/ticket/utils/helpers'

type TicketDeadlineFieldProps = {
    ticket: Ticket
}

export const TicketDeadlineField: React.FC<TicketDeadlineFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const Deadline = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const ToCompleteMessage = intl.formatMessage({ id: 'ticket.deadline.ToComplete' }).toLowerCase()
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' }).toLowerCase()
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' }).toLowerCase()

    const ticketDeadline = ticket.deadline ? dayjs(ticket.deadline) : null
    const getTicketDeadlineMessage = useCallback(() => {
        if (!ticketDeadline) return

        const deadlineType = getDeadlineType(ticket)
        const { dayDiff, overdueDiff } = getHumanizeDeadlineDateDifference(ticket)

        switch (deadlineType) {
            case TicketDeadlineType.MORE_THAN_DAY: {
                return (
                    <Typography.Text type={'warning'} strong>
                        ({ToCompleteMessage.replace('{days}', dayDiff)})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.LESS_THAN_DAY: {
                return (
                    <Typography.Text type={'warning'} strong>
                        ({LessThenDayMessage})
                    </Typography.Text>
                )
            }
            case TicketDeadlineType.OVERDUE: {
                return (
                    <Typography.Text type={'danger'} strong>
                        ({OverdueMessage.replace('{days}', overdueDiff)})
                    </Typography.Text>
                )
            }
        }

    }, [LessThenDayMessage, OverdueMessage, ToCompleteMessage, ticket, ticketDeadline])

    const overdueMessage = useMemo(() => getTicketDeadlineMessage(),
        [getTicketDeadlineMessage])

    return ticketDeadline ? (
        <PageFieldRow title={Deadline} ellipsis={{ rows: 2 }}>
            <Typography.Text strong> {dayjs(ticketDeadline).format('DD MMMM YYYY')} </Typography.Text>
            {overdueMessage}
        </PageFieldRow>
    ) : null
}