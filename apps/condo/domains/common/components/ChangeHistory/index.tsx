import { green } from '@ant-design/colors'
import { Col, Row, Skeleton, Button } from 'antd'
import React, { ComponentProps, ReactElement, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { fontSizes } from '@condo/domains/common/constants/style'

import { BaseChangesType, HistoricalChange } from './HistoricalChange'


type ChangeHistoryInputType<ChangesType> = {
    items: ChangesType[]
    total: number
    loading: boolean
    title: string
    useChangedFieldMessagesOf: ComponentProps<typeof HistoricalChange>['useChangedFieldMessagesOf']
    Diff: ComponentProps<typeof HistoricalChange>['Diff']
}

type ChangeHistoryReturnType = ReactElement | null

const CHANGES_PER_CHUNK = 5
const TEXT_BUTTON_STYLE: React.CSSProperties = {
    fontSize: fontSizes.content,
    padding: 0,
    color: green[6],
}
const CHANGE_HISTORY_COL_STYLE: React.CSSProperties = { marginTop: '20px' }
const CHANGE_HISTORY_VERTICAL_GUTTER: ComponentProps<typeof Row>['gutter'] = [0, 24]


export const ChangeHistory = <ChangesType extends BaseChangesType> (props: ChangeHistoryInputType<ChangesType>): ChangeHistoryReturnType => {
    const { items, total, loading, title, useChangedFieldMessagesOf, Diff } = props

    const intl = useIntl()
    const FetchMoreTemplate = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.fetchMore' })

    const [displayCount, setDisplayCount] = useState(CHANGES_PER_CHUNK)

    const FetchMoreLabel = useMemo(() => {
        return FetchMoreTemplate.replace('{count}', Math.min(total - displayCount, CHANGES_PER_CHUNK))
    }, [FetchMoreTemplate, total, displayCount])

    const handleFetchMore = useCallback(() => {
        setDisplayCount(prevState => prevState + CHANGES_PER_CHUNK)
    }, [])

    if (loading) {
        return <Skeleton/>
    }

    return items.length > 0 && (
        <Col span={24} style={CHANGE_HISTORY_COL_STYLE}>
            <Row gutter={CHANGE_HISTORY_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={4}>{title}</Typography.Title>
                </Col>
                <Col span={24}>
                    {items.slice(0, displayCount).map(change => (
                        <HistoricalChange
                            key={change.id}
                            changesValue={change}
                            useChangedFieldMessagesOf={useChangedFieldMessagesOf}
                            Diff={Diff}
                        />
                    ))}
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
    )
}

export {
    HistoricalChange,
}
