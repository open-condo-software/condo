import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography } from 'antd'
import React from 'react'

const EmptyBuilderBlock: React.FC  = () => {
    const intl = useIntl()
    const EmptyPropertyBuilderHeader = intl.formatMessage({ id: 'pages.condo.property.EmptyBuilderHeader' })
    const EmptyPropertyBuilderDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuilderDescription' })
    const descriptionStyle = {
        display: 'flex',
        fontSize: '16px',
        maxWidth: '350px',
    }
    return (
        <BasicEmptyListView image='/propertyEmpty.svg' >
            <Typography.Title level={3} >
                {EmptyPropertyBuilderHeader}
            </Typography.Title>
            <Typography.Text style={descriptionStyle}>
                {EmptyPropertyBuilderDescription}
            </Typography.Text>
        </BasicEmptyListView>
    )
}

const BuilderPanel: React.FC = () => {

    return (
        <Row >
            <Col span={8} push={8}>
                <EmptyBuilderBlock />
            </Col>
        </Row>
    )
}

export default BuilderPanel

