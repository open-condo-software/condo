import React, { useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { Col, Form, Row, Space } from 'antd'
import { isEmpty } from 'lodash'
import { PlusCircleFilled } from '@ant-design/icons'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'

import { ErrorsContainer } from './ErrorsContainer'

const PROPERTY_DEPENDENCY = ['property']
const handleShouldUpdate = (prev, next) => prev.unitName !== next.unitName

export const CreateMeterReadingsActionBar = ({
    handleSave,
    handleAddMeterButtonClick,
    isLoading,
    newMeterReadings,
}) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    return (
        <Form.Item
            noStyle
            dependencies={PROPERTY_DEPENDENCY}
            shouldUpdate={handleShouldUpdate}
        >
            {
                ({ getFieldsValue }) => {
                    const { property, unitName, clientPhone, clientName } = getFieldsValue(['property', 'unitName', 'clientPhone', 'clientName'])
                    const isSubmitButtonDisabled = !property || !unitName || !clientPhone || !clientName || isEmpty(newMeterReadings)
                    const isCreateMeterButtonDisabled = !property || !unitName || !clientPhone || !clientName

                    return (
                        <ActionBar>
                            <Col>
                                <Row gutter={[0, 24]}>
                                    <Button
                                        key='submit'
                                        onClick={handleSave}
                                        type='sberDefaultGradient'
                                        loading={isLoading}
                                        disabled={isSubmitButtonDisabled}
                                        style={{ marginRight: '12px' }}
                                    >
                                        {SendMetersReadingMessage}
                                    </Button>
                                    <Button
                                        onClick={handleAddMeterButtonClick}
                                        type='sberDefaultGradient'
                                        disabled={isCreateMeterButtonDisabled}
                                        icon={<PlusCircleFilled/>}
                                        secondary
                                        style={{ marginRight: '12px' }}
                                    >
                                        {AddMeterMessage}
                                    </Button>
                                    <ErrorsContainer
                                        property={property}
                                        unitName={unitName}
                                        clientPhone={clientPhone}
                                        clientName={clientName}
                                    />
                                </Row>
                            </Col>
                            <Space size={12}>

                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}
