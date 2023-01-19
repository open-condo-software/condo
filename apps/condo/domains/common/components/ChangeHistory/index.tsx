import React, { ComponentProps, ReactElement, useCallback, useMemo, useState } from 'react'
import { Col, Row, Skeleton, Button } from 'antd'
import { fontSizes } from '../../constants/style'
import { green } from '@ant-design/colors'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
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
        <Col span={24} style={{ marginTop: '20px' }}>
            <Row gutter={[0, 24]}>
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
                            style={{
                                fontSize: fontSizes.content,
                                padding: 0,
                                color: green[6],
                            }}
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
