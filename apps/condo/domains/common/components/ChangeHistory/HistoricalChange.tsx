import { Maybe } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import dayjs from 'dayjs'
import React, { ReactElement, useMemo } from 'react'

import { Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


export type BaseChangesType = {
    createdAt?: Maybe<string>
    actualCreationDate?: Maybe<string>
    id: string
}

type UseChangedFieldMessagesOfType<ChangesType> = (changesValue: ChangesType) => Array<{
    field: string
    message: ReactElement | null
}>

type HistoricalChangeInputType<ChangesType> = {
    changesValue: ChangesType
    useChangedFieldMessagesOf: UseChangedFieldMessagesOfType<ChangesType>
    Diff: React.FC<{ className?: string }>
    labelSpan?: number
}

type HistoricalChangeReturnType = ReactElement

const HISTORICAL_CHANGE_GUTTER: RowProps['gutter'] = [12, 12]

export const HistoricalChange = <ChangesType extends BaseChangesType> (props: HistoricalChangeInputType<ChangesType>): HistoricalChangeReturnType => {
    const { changesValue, useChangedFieldMessagesOf, Diff, labelSpan = 6 } = props

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
                {changedFieldMessages.map(({ field, message }) => (
                    <Typography.Text size='medium' key={field}>
                        <Diff className={field}>
                            {message}
                        </Diff>
                    </Typography.Text>
                ))}
            </Col>
        </Row>
    )
}
