import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Space } from 'antd'
import React from 'react'
import { Button } from '@condo/domains/common/components/Button'

const EmptyResidentBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyResidentsTitle = intl.formatMessage({ id: 'pages.condo.property.form.EmptyResidents.header' })
    const EmptyResidentsMessage = intl.formatMessage({ id: 'pages.condo.property.form.EmptyResidents.text' })
    const UploadFile = intl.formatMessage({ id: 'UploadFile' })
    
    return (
        <BasicEmptyListView>
            <Typography.Title level={3}>
                {EmptyResidentsTitle}
            </Typography.Title>
            <Typography.Text style={{ fontSize: '16px' }}>
                {EmptyResidentsMessage}
            </Typography.Text>
            <Space style={{ marginTop: '24px' }}>
                <Button
                    type={'sberPrimary'}
                    secondary
                >
                    {UploadFile}
                </Button>
            </Space>
        </BasicEmptyListView>
    )
}

const ResidentPanel: React.FC = () => {

    return (
        <Row >
            <Col span={8} push={8}>
                <EmptyResidentBlock />
            </Col>
        </Row>
    )
}

export default ResidentPanel

