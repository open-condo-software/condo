import { BuildingMap, Property } from '@app/condo/schema'
import { Typography, Form } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useState, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction, IFormWithActionChildren } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { BuildingPanelEdit } from '@condo/domains/property/components/panels/Builder/BuildingPanelEdit'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'

export interface IPropertyMapFormProps {
    id: string
    organization: { id: string }
    type: string
    property: Property
    initialValues?: IPropertyFormState
    action?: (...args) => void
    children: IFormWithActionChildren
    canManageProperties?: boolean
}

const PROPERTY_MAP_FORM_STYLES = {
    width: '100%',
}

const PROPERTY_FORM_VALIDATION_TRIGGER = ['onBlur', 'onSubmit']

const BasePropertyMapForm: React.FC<IPropertyMapFormProps> = (props) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'property.warning.modal.HelpMessage' })
    const UnsavedChangesError = intl.formatMessage({ id: 'property.warning.modal.unsavedChanges' })

    const { action, initialValues, property, children, canManageProperties = false } = props

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
                                    const sections = get(value, 'sections', [])
                                    const parking = get(value, 'parking', [])

                                    const hasPreview = (mapComponent) => get(mapComponent, 'preview', false)
                                    if (!isEmpty(sections.filter(hasPreview)) || !isEmpty(parking.filter(hasPreview))) {
                                        setMapValidationError(UnsavedChangesError)
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
                                        canManageProperties={canManageProperties}
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
