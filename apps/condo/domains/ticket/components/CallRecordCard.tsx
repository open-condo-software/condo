import { CallRecord } from '@app/condo/schema'
import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dynamic from 'next/dynamic'
import React, { CSSProperties, useMemo } from 'react'

import { PhoneIncoming, PhoneOutgoing } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography } from '@open-condo/ui'

import { getDateRender } from '@condo/domains/common/components/Table/Renders'
import { formatPhone } from '@condo/domains/common/utils/helpers'

const DynamicAudioPlayer = dynamic(
    () => import('@condo/domains/common/components/AudioPlayer').then((module) => module.AudioPlayer),
    { ssr: false }
)

interface ICallRecordCardProps {
    callRecord: CallRecord
}

const MAIN_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const TITLE_ROW_GUTTER: [Gutter, Gutter] = [12, 0]

const PHONE_ICON_WRAPPER_STYLE: CSSProperties = { position: 'relative', top: '5px' }

export const CallRecordCard: React.FC<ICallRecordCardProps> = ({ callRecord }) => {
    const intl = useIntl()

    const { isIncomingCall, callerPhone, destCallerPhone, startedAt, file } = callRecord

    const formattedStartDate = useMemo(
        () => getDateRender(intl, '', false)(startedAt),
        [intl, startedAt])

    const TitleMessage = isIncomingCall ?
        intl.formatMessage({ id: 'ticket.callRecord.incomingCall' }, { phone: formatPhone(callerPhone) }) :
        intl.formatMessage({ id: 'ticket.callRecord.outgoingCall' }, { phone: formatPhone(destCallerPhone) })
    const PhoneIcon = isIncomingCall ? PhoneIncoming : PhoneOutgoing

    return (
        <Card>
            <Row gutter={MAIN_ROW_GUTTER}>
                <Col span={24}>
                    <Row justify='space-between'>
                        <Col>
                            <Row gutter={TITLE_ROW_GUTTER} align='middle'>
                                <Col style={PHONE_ICON_WRAPPER_STYLE}>
                                    <PhoneIcon size='medium' />
                                </Col>
                                <Col>
                                    <Typography.Title level={4}>{TitleMessage}</Typography.Title>
                                </Col>
                            </Row>
                        </Col>
                        <Col>
                            <Typography.Text size='medium'>{formattedStartDate}</Typography.Text>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <DynamicAudioPlayer src={file.publicUrl} trackId={file.id} />
                </Col>
            </Row>
        </Card>
    )
}