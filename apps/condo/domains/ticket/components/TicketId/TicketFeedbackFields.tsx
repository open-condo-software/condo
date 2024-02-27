import { Ticket, TicketFeedbackValueType, FeedbackAdditionalOptionsType } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { convertQualityControlOrFeedbackOptionsToText, filterFeedbackOptionsByScore } from '@condo/domains/ticket/utils'


type TicketFeedbackFieldProps = {
    ticket: Ticket
}

type TicketFeedbackValueFieldProps = TicketFeedbackFieldProps

type TicketFeedbackCommentFieldProps = {
    ticket: Ticket
}

type OptionsMessagesType = Record<FeedbackAdditionalOptionsType, string>

const FEEDBACK_SMALL_GUTTER: RowProps['gutter'] = [0, 12]
const FEEDBACK_BIG_GUTTER: RowProps['gutter'] = [0, 24]

const TicketFeedbackValueField: React.FC<TicketFeedbackValueFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const FeedbackMessage = intl.formatMessage({ id: 'ticket.feedback' })
    const BadMessage = intl.formatMessage({ id: 'ticket.feedback.bad' })
    const GoodMessage = intl.formatMessage({ id: 'ticket.feedback.good' })
    const LowQualityMessage = intl.formatMessage({ id: 'ticket.feedback.options.lowQuality' })
    const SlowlyMessage = intl.formatMessage({ id: 'ticket.feedback.options.slowly' })
    const HighQualityMessage = intl.formatMessage({ id: 'ticket.feedback.options.highQuality' })
    const QuicklyMessage = intl.formatMessage({ id: 'ticket.feedback.options.quickly' })

    const isBad = ticket.feedbackValue === TicketFeedbackValueType.Bad
    const isGood = ticket.feedbackValue === TicketFeedbackValueType.Good

    const optionsMessages: OptionsMessagesType = useMemo(() => ({
        [FeedbackAdditionalOptionsType.LowQuality]: LowQualityMessage.toLowerCase(),
        [FeedbackAdditionalOptionsType.Slowly]: SlowlyMessage.toLowerCase(),
        [FeedbackAdditionalOptionsType.HighQuality]: HighQualityMessage.toLowerCase(),
        [FeedbackAdditionalOptionsType.Quickly]: QuicklyMessage.toLowerCase(),
    }), [HighQualityMessage, LowQualityMessage, QuicklyMessage, SlowlyMessage])

    const renderOptions = useMemo(() => {
        if (isEmpty(ticket.feedbackAdditionalOptions) || !ticket.feedbackValue) return null
        const selectedOption = filterFeedbackOptionsByScore(ticket.feedbackValue, ticket.feedbackAdditionalOptions)
        const textOptions = convertQualityControlOrFeedbackOptionsToText(selectedOption, optionsMessages)
        return textOptions && ` (${textOptions})`
    }, [optionsMessages, ticket.feedbackAdditionalOptions, ticket.feedbackValue])

    return (
        <PageFieldRow title={FeedbackMessage}>
            {
                ticket.feedbackValue && (
                    <Typography.Text>
                        <Typography.Text>
                            {
                                isBad
                                    ? `${BadMessage} ${EMOJI.DISAPPOINTED}`
                                    : (isGood && `${GoodMessage} ${EMOJI.BLUSH}`)
                            }
                        </Typography.Text>
                        <Typography.Text type='secondary'>
                            {renderOptions}
                        </Typography.Text>
                    </Typography.Text>
                )
            }
        </PageFieldRow>
    )
}

const TicketFeedbackCommentField: React.FC<TicketFeedbackCommentFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const CommentMessage = intl.formatMessage({ id: 'ticket.feedbackComment' })

    return ticket.feedbackComment && (
        <PageFieldRow title={CommentMessage} ellipsis>
            <Typography.Text>
                {ticket.feedbackComment}
            </Typography.Text>
        </PageFieldRow>
    )
}

export const TicketFeedbackFields: React.FC<TicketFeedbackFieldProps> = ({ ticket }) => {
    const { breakpoints } = useLayoutContext()

    return ticket.feedbackValue && (
        <Col span={24}>
            <Row gutter={breakpoints.TABLET_LARGE ? FEEDBACK_BIG_GUTTER : FEEDBACK_SMALL_GUTTER}>
                <TicketFeedbackValueField ticket={ticket} />
                <TicketFeedbackCommentField ticket={ticket} />
            </Row>
        </Col>
    )
}
