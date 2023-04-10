import { Col, Row } from 'antd'
import get from 'lodash/get'
import React, { useEffect } from 'react'

import { useTracking } from '@condo/domains/common/components/TrackingContext'

import { ReceiptsTable } from './ReceiptsTable'

import { ReportMessage } from '../ReportMessage'

import { IContextProps } from './index'



export const MainContent: React.FC<IContextProps> = ({ context }) => {
    const { logEvent } = useTracking()

    const lastReport = get(context, 'lastReport')

    useEffect(() => {
        logEvent({ eventName: 'BillingPageSuccessStatus', denyDuplicates: true })
    }, [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <ReportMessage lastReport={lastReport}/>
            </Col>
            <Col span={24}>
                <ReceiptsTable context={context}/>
            </Col>
        </Row>
    )
}

