import React from 'react'
import { Col, Tabs, Tooltip } from 'antd'
import { useIntl } from '@core/next/intl'
import { IContextProps } from './index'
import { DemoReceiptsTable } from './DemoReceiptsTable'

export const MainContent: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const AccrualsTitle = intl.formatMessage({ id: 'Accruals' })
    const MetersTitle = intl.formatMessage({ id: 'Meters' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })

    return (
        <Col span={24}>
            <Tabs
                defaultActiveKey={'Accruals'}
                tabBarStyle={{ marginBottom: 40 }}
                style={{ overflow: 'visible' }}
            >
                <Tabs.TabPane key={'Accruals'} tab={AccrualsTitle}>
                    <DemoReceiptsTable context={context}/>
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
    )
}

