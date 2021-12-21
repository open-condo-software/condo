import { useIntl } from '@core/next/intl'
import { Form, Space } from 'antd'
import { isEmpty } from 'lodash'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PlusCircleFilled } from '@ant-design/icons'
import { ErrorsContainer } from './ErrorsContainer'
import React from 'react'

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
            dependencies={['property']}
            shouldUpdate={(prev, next) => prev.unitName !== next.unitName}
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
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={isSubmitButtonDisabled}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <Button
                                    onClick={handleAddMeterButtonClick}
                                    type='sberPrimary'
                                    disabled={isCreateMeterButtonDisabled}
                                    icon={<PlusCircleFilled/>}
                                    secondary
                                >
                                    {AddMeterMessage}
                                </Button>
                                <ErrorsContainer
                                    property={property}
                                    unitName={unitName}
                                    newMeterReadings={newMeterReadings}
                                />
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}
