import { CallRecord } from '@app/condo/schema'
import { Row, Col, RowProps } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import { AudioPlayer } from '@condo/domains/common/components/AudioPlayer'
import { getDateRender } from '@condo/domains/common/components/Table/Renders'
import { formatPhone } from '@condo/domains/common/utils/helpers'


interface ICallRecordCardProps {
    callRecord: CallRecord
    autoPlay?: boolean
}

const MAIN_ROW_GUTTER: RowProps['gutter'] = [0, 20]

export const CallRecordCard: React.FC<ICallRecordCardProps> = ({ callRecord, autoPlay }) => {
    const intl = useIntl()

    const { isIncomingCall, callerPhone, destCallerPhone, startedAt, file } = callRecord

    const formattedStartDate = useMemo(
        () => getDateRender(intl, '', ' ')(startedAt),
        [intl, startedAt])

    const TitleMessage = isIncomingCall ?
        intl.formatMessage({ id: 'ticket.callRecord.incomingCall' }, { phone: formatPhone(callerPhone) }) :
        intl.formatMessage({ id: 'ticket.callRecord.outgoingCall' }, { phone: formatPhone(destCallerPhone) })

    return (
        <Card>
            <Row gutter={MAIN_ROW_GUTTER}>
                <Col span={24}>
                    <Row justify='space-between'>
                        <Col>
                            <Typography.Title level={4}>{TitleMessage}</Typography.Title>
                        </Col>
                        <Col>
                            <Typography.Text size='medium'>{formattedStartDate}</Typography.Text>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <AudioPlayer
                        src={file.publicUrl}
                        trackId={file.id}
                        autoPlay={autoPlay}
                    />
                </Col>
            </Row>
        </Card>
    )
}