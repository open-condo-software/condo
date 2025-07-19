import { BuildingMap, Property } from '@app/condo/schema'
import { Typography, Form, notification } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction, IFormWithActionChildren } from '@condo/domains/common/components/containers/FormList'
import Prompt from '@condo/domains/common/components/Prompt'
import { BuildingPanelEdit } from '@condo/domains/property/components/panels/Builder/BuildingPanelEdit'
import { IPropertyFormState } from '@condo/domains/property/utils/clientSchema/Property'
import { getUniqUnits, getUnitsFromSections } from '@condo/domains/property/utils/helpers'


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
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.property.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.property.warning.modal.HelpMessage' })
    const UnsavedChangesError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.unsavedChanges' })
    const UnitLabelsNotUniqueError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })
    const UnitLabelEmptyError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.emptyUnitName' })

    const { action, initialValues, property, children, canManageProperties = false } = props

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

                                    const sectionUnits = getUnitsFromSections(sections)
                                    const parkingUnits = getUnitsFromSections(parking)

                                    if (sectionUnits.some(unit => !get(unit, 'label', '').length)
                                    || parkingUnits.some(unit => !get(unit, 'label', '').length)) {
                                        notification.error({
                                            message: UnitLabelEmptyError,
                                        })
                                        return Promise.reject(UnitLabelEmptyError)
                                    }

                                    if (sectionUnits.length !== getUniqUnits(sectionUnits).length
                                        || parkingUnits.length !== getUniqUnits(parkingUnits).length) {
                                        notification.error({
                                            message: UnitLabelsNotUniqueError,
                                        })
                                        return Promise.reject(UnitLabelsNotUniqueError)
                                    }

                                    const hasPreview = (mapComponent) => get(mapComponent, 'preview', false)
                                    if (!isEmpty(sections.filter(hasPreview)) || !isEmpty(parking.filter(hasPreview))) {
                                        notification.error({
                                            message: UnsavedChangesError,
                                        })
                                        return Promise.reject(UnsavedChangesError)
                                    }

                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={true}
                    >
                        {
                            ({ getFieldsValue, setFieldsValue }) => {
                                const { map } = getFieldsValue(['map'])
                                return (
                                    <BuildingPanelEdit
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
