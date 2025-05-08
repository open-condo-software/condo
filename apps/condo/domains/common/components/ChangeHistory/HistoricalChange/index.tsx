import { Col, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { BaseChangesType, HistoricalChangeReturnType, HistoricalChangeInputType } from './types'


const HISTORICAL_CHANGE_GUTTER: RowProps['gutter'] = [12, 12]
const MESSAGES_VERTICAL_GUTTER: RowProps['gutter'] = [0, 8]

export const HistoricalChange = <ChangesType extends BaseChangesType> (props: HistoricalChangeInputType<ChangesType>): HistoricalChangeReturnType => {
    const { changesValue, useChangedFieldMessagesOf, labelSpan = 6 } = props

    const changedFieldMessages = useChangedFieldMessagesOf(changesValue)
    const { breakpoints } = useLayoutContext()

    const dateToShow = changesValue.actualCreationDate || changesValue.createdAt
    const formattedDate = useMemo(() => dayjs(dateToShow).format('DD.MM.YYYY'), [dateToShow])
    const formattedTime = useMemo(() => dayjs(dateToShow).format('HH:mm'), [dateToShow])

    return (
        <Row gutter={HISTORICAL_CHANGE_GUTTER}>
            <Col xs={24} md={labelSpan}>
                <Typography.Text size='medium' disabled={!breakpoints.TABLET_LARGE}>
                    {formattedDate}
                    <Typography.Text size='medium' type='secondary'>, {formattedTime}</Typography.Text>
                </Typography.Text>
            </Col>
            <Col md={24 - labelSpan - 1} xs={24} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                <Row gutter={MESSAGES_VERTICAL_GUTTER}>
                    {changedFieldMessages.map(({ field, message }) => (
                        <Col key={field} span={24} id={field}>
                            <Typography.Text size='medium'>
                                {message}
                            </Typography.Text>
                        </Col>
                    ))}
                </Row>
            </Col>
        </Row>
    )
}
