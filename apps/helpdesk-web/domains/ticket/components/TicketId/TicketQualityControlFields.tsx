import { Ticket, TicketQualityControlValueType, QualityControlAdditionalOptionsType } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'
import { useTicketQualityControl } from '@condo/domains/ticket/contexts/TicketQualityControlContext'
import { convertQualityControlOrFeedbackOptionsToText, filterQualityControlOptionsByScore } from '@condo/domains/ticket/utils'


type TicketQualityControlFieldProps = {
    ticket: Ticket
}

type TicketQualityControlValueFieldProps = TicketQualityControlFieldProps

type TicketQualityControlCommentFieldProps = {
    ticket: Ticket
}

type OptionsMessagesType = Record<QualityControlAdditionalOptionsType, string>

const SCORE_WRAPPER_GUTTER: RowProps['gutter'] = [16, 0]
const QUALITY_CONTROL_SMALL_GUTTER: RowProps['gutter'] = [0, 12]
const QUALITY_CONTROL_BIG_GUTTER: RowProps['gutter'] = [0, 24]

export const TicketQualityControlValueField: React.FC<TicketQualityControlValueFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const QualityControlMessage = intl.formatMessage({ id: 'ticket.qualityControl' })
    const BadMessage = intl.formatMessage({ id: 'ticket.qualityControl.bad' })
    const GoodMessage = intl.formatMessage({ id: 'ticket.qualityControl.good' })
    const LowQualityMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.lowQuality' })
    const SlowlyMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.slowly' })
    const HighQualityMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.highQuality' })
    const QuicklyMessage = intl.formatMessage({ id: 'ticket.qualityControl.options.quickly' })

    const { BadButton, GoodButton, QualityControlModals } = useTicketQualityControl()

    const isBad = ticket.qualityControlValue === TicketQualityControlValueType.Bad
    const isGood = ticket.qualityControlValue === TicketQualityControlValueType.Good

    const optionsMessages: OptionsMessagesType = useMemo(() => ({
        [QualityControlAdditionalOptionsType.LowQuality]: LowQualityMessage.toLowerCase(),
        [QualityControlAdditionalOptionsType.Slowly]: SlowlyMessage.toLowerCase(),
        [QualityControlAdditionalOptionsType.HighQuality]: HighQualityMessage.toLowerCase(),
        [QualityControlAdditionalOptionsType.Quickly]: QuicklyMessage.toLowerCase(),
    }), [HighQualityMessage, LowQualityMessage, QuicklyMessage, SlowlyMessage])

    const renderOptions = useMemo(() => {
        if (isEmpty(ticket.qualityControlAdditionalOptions) || !ticket.qualityControlValue) return null
        const selectedOption = filterQualityControlOptionsByScore(ticket.qualityControlValue, ticket.qualityControlAdditionalOptions)
        const textOptions = convertQualityControlOrFeedbackOptionsToText(selectedOption, optionsMessages)
        return textOptions && ` (${textOptions})`
    }, [optionsMessages, ticket.qualityControlAdditionalOptions, ticket.qualityControlValue])

    return (
        <>
            <PageFieldRow title={QualityControlMessage} align={ticket.qualityControlValue ? 'top' : 'middle'}>
                {
                    ticket.qualityControlValue ? (
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
                    ) : (
                        <Row gutter={SCORE_WRAPPER_GUTTER}>
                            <Col>
                                {BadButton}
                            </Col>
                            <Col>
                                {GoodButton}
                            </Col>
                        </Row>
                    )
                }
            </PageFieldRow>
            {QualityControlModals}
        </>
    )
}

export const TicketQualityControlCommentField: React.FC<TicketQualityControlCommentFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const CommentMessage = intl.formatMessage({ id: 'ticket.qualityControlComment' })

    return ticket.qualityControlComment && (
        <PageFieldRow title={CommentMessage} ellipsis>
            <Typography.Text>
                {ticket.qualityControlComment}
            </Typography.Text>
        </PageFieldRow>
    )
}

export const TicketQualityControlFields: React.FC<TicketQualityControlFieldProps> = ({ ticket }) => {
    const { breakpoints } = useLayoutContext()
    const ticketStatusId = get(ticket, 'status.id')
    const shouldShow = get(ticket, 'qualityControlValue') || ticketStatusId === STATUS_IDS.COMPLETED || ticketStatusId === STATUS_IDS.CLOSED

    return shouldShow && (
        <Col span={24}>
            <Row gutter={breakpoints.TABLET_LARGE ? QUALITY_CONTROL_BIG_GUTTER : QUALITY_CONTROL_SMALL_GUTTER}>
                <TicketQualityControlValueField ticket={ticket} />
                <TicketQualityControlCommentField ticket={ticket} />
            </Row>
        </Col>
    )
}
