import { Col, Row, Typography, Space } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { fontSizes } from '@condo/domains/common/constants/style'

const EmptyResidentBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyResidentsTitle = intl.formatMessage({ id: 'property.form.emptyResidents.header' })
    const EmptyResidentsMessage = intl.formatMessage({ id: 'property.form.emptyResidents.text' })
    const UploadFile = intl.formatMessage({ id: 'uploadFile' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'notImplementedYet' })
    
    return (
        <BasicEmptyListView>
            <Typography.Title level={3}>
                {EmptyResidentsTitle}
            </Typography.Title>
            <Typography.Text style={{ fontSize: fontSizes.content, maxWidth: '350px', display: 'flex' }}>
                {EmptyResidentsMessage}
            </Typography.Text>
            <Space style={{ marginTop: '24px' }}>
                <Tooltip title={NotImplementedYetMessage}>
                    <Button
                        type='sberPrimary'
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
