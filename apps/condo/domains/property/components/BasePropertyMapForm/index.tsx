// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState, useCallback } from 'react'
import { Typography, Form, Input } from 'antd'
import { useIntl } from '@core/next/intl'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { IPropertyFormState, IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'
import { BuildingMap } from '@app/condo/schema'
import { BuildingPanelEdit } from '../panels/Builder/BuildingPanelEdit'

interface IPropertyMapFormProps {
    id: string
    organization: { id: string }
    type: string
    property: IPropertyUIState
    initialValues?: IPropertyFormState
    action?: (...args) => void
}

const PROPERTY_MAP_FORM_STYLES = {
    width: '100%',
}

const PROPERTY_FORM_VALIDATION_TRIGGER = ['onBlur', 'onSubmit']

const BasePropertyMapForm: React.FC<IPropertyMapFormProps> = ({ action, initialValues, property, children }) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const SameUnitNamesErrorMsg = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const [mapValidationError, setMapValidationError] = useState<string | null>(null)

    const onFormBlur = useCallback(() => {
        setMapValidationError(null)
    }, [])

    return (
        <FormWithAction
            action={action}
            initialValues={initialValues}
            validateTrigger={PROPERTY_FORM_VALIDATION_TRIGGER}
            style={PROPERTY_MAP_FORM_STYLES}
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
                        onBlur={onFormBlur}
                    >
                        {
                            ({ getFieldsValue, setFieldsValue }) => {
                                const { map } = getFieldsValue(['map'])
                                return (
                                    <BuildingPanelEdit
                                        mapValidationError={mapValidationError}
                                        handleSave={handleSave}
                                        map={map as BuildingMap}
                                        updateMap={map => setFieldsValue({ map })}
                                        property={property}
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
