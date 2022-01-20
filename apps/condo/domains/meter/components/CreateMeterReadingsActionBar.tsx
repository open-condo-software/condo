import React, { useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { Form, Space } from 'antd'
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
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])
                    const isSubmitButtonDisabled = !property || !unitName || isEmpty(newMeterReadings)
                    const isCreateMeterButtonDisabled = !property || !unitName

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberDefaultGradient'
                                    loading={isLoading}
                                    disabled={isSubmitButtonDisabled}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <Button
                                    onClick={handleAddMeterButtonClick}
                                    type='sberDefaultGradient'
                                    disabled={isCreateMeterButtonDisabled}
                                    icon={<PlusCircleFilled/>}
                                    secondary
                                >
                                    {AddMeterMessage}
                                </Button>
                                <ErrorsContainer
                                    property={property}
                                    unitName={unitName}
                                />
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}
