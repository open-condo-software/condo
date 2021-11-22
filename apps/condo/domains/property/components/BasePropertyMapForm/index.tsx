// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from 'react'
import { Typography, Form, Input } from 'antd'
import { useIntl } from '@core/next/intl'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { PropertyPanels } from '../panels'

interface IPropertyMapFormProps {
    id: string
    organization: { id: string }
    type: string
    property: {
        address: string
    }
    initialValues?: IPropertyFormState
    action?: (...args) => void
}

const BasePropertyMapForm: React.FC<IPropertyMapFormProps> = ({ action, initialValues, property, children }) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const SameUnitNamesErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const [mapValidationError, setMapValidationError] = useState<string | null>(null)

    return (
        <FormWithAction
            action={action}
            initialValues={initialValues}
            validateTrigger={['onBlur', 'onSubmit']}
            style={{ width: '100%' }}
        >
            {({ handleSave, isLoading, form }) => (
                <>
                    <Prompt
                        title={PromptTitle}
                        form={form}
                        handleSave={handleSave}
                    >
                        <Typography.Paragraph>
                            {PromptHelpMessage}
                        </Typography.Paragraph>
                    </Prompt>
                    <Form.Item
                        hidden
                        name='map'
                        rules={[
                            {
                                validator (rule, value) {
                                    const unitLabels = value?.sections
                                        ?.map((section) => section.floors
                                            ?.map(floor => floor.units
                                                ?.map(unit => unit.label)
                                            )
                                        )
                                        .flat(2)

                                    if (unitLabels && unitLabels.length !== new Set(unitLabels).size) {
                                        setMapValidationError(SameUnitNamesErrorMsg)
                                        return Promise.reject()
                                    }

                                    setMapValidationError(null)
                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={true}
                        // @ts-ignore
                        onBlur={() => setMapValidationError(null)}
                    >
                        {
                            ({ getFieldsValue, setFieldsValue }) => {
                                const { map } = getFieldsValue(['map'])
                                return (
                                    <PropertyPanels
                                        mapValidationError={mapValidationError}
                                        mode='edit'
                                        map={map}
                                        handleSave={handleSave}
                                        updateMap={map => setFieldsValue({ map })}
                                        address={property.address}
                                    />
                                )
                            }
                        }
                    </Form.Item>
                    {children({ handleSave, isLoading, form })}
                </>
            )}
        </FormWithAction>
    )
}

export default BasePropertyMapForm
