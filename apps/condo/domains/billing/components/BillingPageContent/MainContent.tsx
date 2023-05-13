import { Col, Row } from 'antd'
import get from 'lodash/get'
import React, { useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { useTracking } from '@condo/domains/common/components/TrackingContext'

import { ReceiptsTable } from './ReceiptsTable'

import { ReportMessage } from '../ReportMessage'

import { IContextProps } from './index'



export const MainContent: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const LoadRegistryButton = intl.formatMessage({ id: 'pages.billing.ReceiptsTable.loadRegistry.button' })
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
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Button
                            key='load'
                            type='primary'
                        >
                            {LoadRegistryButton}
                        </Button>,
                    ]}
                />
            </Col>
        </Row>
    )
}

