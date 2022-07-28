import React, { CSSProperties } from 'react'
import { useIntl } from '@core/next/intl'
import { Col, Form, Row } from 'antd'
import { isEmpty } from 'lodash'
import { PlusCircleFilled } from '@ant-design/icons'

import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'

import { ErrorsContainer } from './ErrorsContainer'
import { Gutter } from 'antd/es/grid/row'

const BUTTON_STYLE: CSSProperties = { marginRight: '12px' }
const VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
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
                                <Row gutter={VERTICAL_GUTTER}>
                                    <Button
                                        key='submit'
                                        onClick={handleSave}
                                        type='sberDefaultGradient'
                                        loading={isLoading}
                                        disabled={isSubmitButtonDisabled}
                                        style={BUTTON_STYLE}
                                    >
                                        {SendMetersReadingMessage}
                                    </Button>
                                    <Button
                                        onClick={handleAddMeterButtonClick}
                                        type='sberDefaultGradient'
                                        disabled={isCreateMeterButtonDisabled}
                                        icon={<PlusCircleFilled/>}
                                        secondary
                                        style={BUTTON_STYLE}
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
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}
