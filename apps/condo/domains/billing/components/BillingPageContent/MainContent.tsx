import React from 'react'
import { Col, Row, Tabs, Tooltip } from 'antd'
import { useIntl } from '@core/next/intl'
import { IContextProps } from './index'
import { ReceiptsTable } from './ReceiptsTable'
import get from 'lodash/get'
import { ReportMessage } from '../ReportMessage'

export const MainContent: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const AccrualsTitle = intl.formatMessage({ id: 'Accruals' })
    const MetersTitle = intl.formatMessage({ id: 'Meters' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })

    const lastReport = get(context, 'lastReport')
    const lastReportFinishTime = get(lastReport, 'finishTime')
    const lastReportRecords = get(lastReport, 'totalReceipts', 0)


    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                {
                    lastReport && (
                        <ReportMessage totalRows={lastReportRecords} finishTime={lastReportFinishTime}/>
                    )
                }
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

