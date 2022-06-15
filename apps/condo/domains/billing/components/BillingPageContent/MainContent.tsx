import React, { useEffect } from 'react'
import { Col, Row, Tabs, Tooltip } from 'antd'
import { useIntl } from '@core/next/intl'
import { IContextProps } from './index'
import { ReceiptsTable } from './ReceiptsTable'
import get from 'lodash/get'
import { ReportMessage } from '../ReportMessage'
import { useTracking } from '@condo/domains/common/components/TrackingContext'

export const MainContent: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const AccrualsTitle = intl.formatMessage({ id: 'Accruals' })
    const MetersTitle = intl.formatMessage({ id: 'Meters' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })

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
                <Tabs
                    defaultActiveKey={'Accruals'}
                    tabBarStyle={{ marginBottom: 40 }}
                    style={{ overflow: 'visible' }}
                >
                    <Tabs.TabPane key={'Accruals'} tab={AccrualsTitle}>
                        <ReceiptsTable context={context}/>
                    </Tabs.TabPane>
                    <Tabs.TabPane
                        key={'meters'}
                        tab={(
                            <Tooltip title={NotImplementedYetMessage}>
                                {MetersTitle}
                            </Tooltip>
                        )}
                        disabled
                    />
                </Tabs>
            </Col>
        </Row>
    )
}

