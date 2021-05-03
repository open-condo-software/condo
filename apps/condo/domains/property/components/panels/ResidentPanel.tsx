import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Space, Tooltip } from 'antd'
import React from 'react'
import { Button } from '@condo/domains/common/components/Button'

const EmptyResidentBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyResidentsTitle = intl.formatMessage({ id: 'pages.condo.property.form.EmptyResidents.header' })
    const EmptyResidentsMessage = intl.formatMessage({ id: 'pages.condo.property.form.EmptyResidents.text' })
    const UploadFile = intl.formatMessage({ id: 'UploadFile' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    
    return (
        <BasicEmptyListView>
            <Typography.Title level={3}>
                {EmptyResidentsTitle}
            </Typography.Title>
            <Typography.Text  style={{ fontSize: '16px', maxWidth: '350px', display: 'flex' }}>
                {EmptyResidentsMessage}
            </Typography.Text>
            <Space style={{ marginTop: '24px' }}>
                <Tooltip title={NotImplementedYetMessage}>
                    <Button
                        type={'sberPrimary'}
                        secondary
                    >
                        {UploadFile}
                    </Button>
                </Tooltip>
            </Space>
        </BasicEmptyListView>
    )
}

export const ResidentPanelView: React.FC = () => {

    return (
        <Row style={{ marginTop: '40px', marginBottom: '40px' }}>
            <Col span={24}>
                <EmptyResidentBlock />
            </Col>
        </Row>
    )
}

export const ResidentPanelEdit: React.FC = () => {

    return (
        <Row style={{ marginTop: '40px', marginBottom: '40px' }}>
            <Col span={24}>
                <EmptyResidentBlock />
            </Col>
        </Row>
    )
}
