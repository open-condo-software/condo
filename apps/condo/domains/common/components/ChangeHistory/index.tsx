import { Col, Row, Skeleton, Button, RowProps } from 'antd'
import React, { ReactElement, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { fontSizes } from '@condo/domains/common/constants/style'

import { BaseChangesType, HistoricalChangeInputType, HistoricalChangeReturnType } from './HistoricalChange/types'


type ChangeHistoryInputType<ChangesType extends BaseChangesType> = {
    items: ChangesType[]
    total: number
    loading: boolean
    title: string
    useChangedFieldMessagesOf: HistoricalChangeInputType<ChangesType>['useChangedFieldMessagesOf']
    labelSpan?: number
    HistoricalChange: (props: HistoricalChangeInputType<ChangesType>) => HistoricalChangeReturnType
    id?: string
}

type ChangeHistoryReturnType = ReactElement | null

const CHANGES_PER_CHUNK = 5
const TEXT_BUTTON_STYLE: React.CSSProperties = {
    fontSize: fontSizes.content,
    padding: 0,
    color: colors.green[7],
}
const CHANGE_HISTORY_COL_STYLE: React.CSSProperties = { marginTop: '20px' }
const CHANGE_HISTORY_VERTICAL_GUTTER: RowProps['gutter'] = [0, 16]


export const ChangeHistory = <ChangesType extends BaseChangesType> (props: ChangeHistoryInputType<ChangesType>): ChangeHistoryReturnType => {
    const intl = useIntl()
    const FetchMoreTemplate = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.fetchMore' })

    const { items, total, loading, title, useChangedFieldMessagesOf, labelSpan, HistoricalChange, id } = props

    const [displayCount, setDisplayCount] = useState(CHANGES_PER_CHUNK)

    const FetchMoreLabel = useMemo(() => {
        return FetchMoreTemplate.replace('{count}', String(Math.min(total - displayCount, CHANGES_PER_CHUNK)))
    }, [FetchMoreTemplate, total, displayCount])

    const handleFetchMore = useCallback(() => {
        setDisplayCount(prevState => prevState + CHANGES_PER_CHUNK)
    }, [])

    if (loading && items.length < 1) {
        return <Skeleton/>
    }

    return items.length > 0 && (
        <Col span={24} style={CHANGE_HISTORY_COL_STYLE} id={id ?? undefined}>
            <Row gutter={CHANGE_HISTORY_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{title}</Typography.Title>
                </Col>
                <Col span={24}>
                    <Row gutter={CHANGE_HISTORY_VERTICAL_GUTTER}>
                        {items.slice(0, displayCount).map(change => (
                            <Col span={24} key={change.id} id={change.id}>
                                <HistoricalChange
                                    changesValue={change}
                                    useChangedFieldMessagesOf={useChangedFieldMessagesOf}
                                    labelSpan={labelSpan}
                                />
                            </Col>
                        ))}
                        <Col span={24}>
                            {displayCount < total && (
                                <Button
                                    type='text'
                                    onClick={handleFetchMore}
                                    style={TEXT_BUTTON_STYLE}
                                >
                                    ↓&nbsp;{FetchMoreLabel}
                                </Button>
                            )}
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}
