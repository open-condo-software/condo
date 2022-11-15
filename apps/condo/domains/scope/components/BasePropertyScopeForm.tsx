import { Col, Form, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { difference, isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import {
    searchOrganizationProperty,
} from '@condo/domains/scope/utils/clientSchema/search'
import { SETTINGS_TAB_PROPERTY_SCOPE } from '@condo/domains/common/constants/settingsTabs'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '@condo/domains/scope/utils/clientSchema'
import {
    PropertyScopeOrganizationEmployee as PropertyScopeOrganizationEmployeeType,
    PropertyScopeProperty as PropertyScopePropertyType,
} from '@app/condo/schema'
import { Loader } from '@condo/domains/common/components/Loader'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { searchEmployeeWithSpecializations } from '@condo/domains/organization/utils/clientSchema/search'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MAX_NAME_LENGTH } from '@condo/domains/scope/constants/index'
import { useDeepCompareEffect } from '../../common/hooks/useDeepCompareEffect'

import { FormHintAlert } from './FormHintAlert'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol: {
        sm: 18,
    },
}

const LAYOUT = {
    layout: 'horizontal',
}

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const PROPERTY_SCOPE_NAME_FIELD_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol:{
        sm: 9,
    },
}
const BASE_FORM_ITEM_PROPS = {
    validateFirst: true,
    required: true,
    ...INPUT_LAYOUT_PROPS,
}
const BASE_SELECT_PROPS = {
    showArrow: false,
    infinityScroll: true,
}

type BasePropertyScopeFormProps = {
    children
    action
    organizationId: string
    initialValues?: {
        id: string
        name?: string
        propertyScopeProperties: PropertyScopePropertyType[]
        propertyScopeEmployees: PropertyScopeOrganizationEmployeeType[]
        hasAllProperties?: boolean
        hasAllEmployees?: boolean
    }
    loading?: boolean
}

export const BasePropertyScopeForm: React.FC<BasePropertyScopeFormProps> = ({ children, action, organizationId, initialValues = {}, loading }) => {
    const intl = useIntl()
    const PropertyScopeNameMessage = intl.formatMessage({ id: 'field.Name' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })
    const CheckAllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllProperties' })
    const CheckAllEmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllEmployees' })

    const router = useRouter()

    const { maxLengthValidator, trimValidator } = useValidations()
    const nameValidations = useMemo(() => [trimValidator, maxLengthValidator(MAX_NAME_LENGTH)], [maxLengthValidator, trimValidator])

    const createPropertyScopePropertyAction = PropertyScopeProperty.useCreate({})
    const softDeletePropertyScopePropertyAction = PropertyScopeProperty.useSoftDelete()

    const createPropertyScopeEmployeeAction = PropertyScopeOrganizationEmployee.useCreate({})
    const softDeletePropertyScopeEmployeeAction = PropertyScopeOrganizationEmployee.useSoftDelete()

    const { propertyScopeProperties = [], propertyScopeEmployees = [] } = initialValues
    const initialProperties = useMemo(() => propertyScopeProperties.map(propertyScopeProperty => propertyScopeProperty.property.id), [propertyScopeProperties])
    const initialEmployees = useMemo(() => propertyScopeEmployees.map(propertyScopeEmployee => propertyScopeEmployee.employee.id), [propertyScopeEmployees])

    const initialFormValues = { ...initialValues, employees: initialEmployees, properties: initialProperties }

    const [showHintAlert, setShowHintAlert] = useState<boolean>()
    useDeepCompareEffect(() => {
        if (!loading && initialValues) {
            setShowHintAlert(!isEmpty(initialEmployees))
        }
    }, [initialEmployees, initialValues, loading])

    const handleFormSubmit = useCallback(async (values) => {
        const { properties, employees, ...otherValues } = values

        const propertyScope = await action(otherValues)

        const newProperties = initialProperties ? difference(properties, initialProperties) : properties
        for (const propertyId of newProperties) {
            await createPropertyScopePropertyAction({
                propertyScope: { connect: { id: propertyScope.id } },
                property: { connect: { id: propertyId } },
            })
        }
        const deletedProperties = difference(initialProperties, properties)
        const propertyScopePropertiesToDelete = propertyScopeProperties
            .filter(propertyScopeProperty => deletedProperties.includes(propertyScopeProperty.property.id))
        for (const propertyScopeProperty of propertyScopePropertiesToDelete) {
            await softDeletePropertyScopePropertyAction(propertyScopeProperty)
        }

        const newEmployees = difference(employees, initialEmployees)
        for (const employeeId of newEmployees) {
            await createPropertyScopeEmployeeAction({
                propertyScope: { connect: { id: propertyScope.id } },
                employee: { connect: { id: employeeId } },
            })
        }
        const deletedEmployees = difference(initialEmployees, employees)
        const propertyScopeEmployeesToDelete = propertyScopeEmployees
            .filter(propertyScopeEmployee => deletedEmployees.includes(propertyScopeEmployee.employee.id))
        for (const propertyScopeEmployee of propertyScopeEmployeesToDelete) {
            await softDeletePropertyScopeEmployeeAction(propertyScopeEmployee)
        }

        await router.push(`/settings?tab=${SETTINGS_TAB_PROPERTY_SCOPE}`)
    }, [
        action, createPropertyScopeEmployeeAction, createPropertyScopePropertyAction, initialEmployees,
        initialProperties, propertyScopeEmployees, propertyScopeProperties, router, softDeletePropertyScopeEmployeeAction, softDeletePropertyScopePropertyAction,
    ])

    const propertiesFormItemProps = useMemo(() => ({
        name: 'properties',
        label: PropertiesMessage,
        ...BASE_FORM_ITEM_PROPS,
    }), [PropertiesMessage])
    const propertiesSelectProps = useMemo(() => ({
        initialValue: initialProperties,
        search: searchOrganizationProperty(organizationId),
        disabled: !organizationId,
        ...BASE_SELECT_PROPS,
    }), [initialProperties, organizationId])
    const employeesFormItemProps = useMemo(() => ({
        name: 'employees',
        label: EmployeesMessage,
        ...BASE_FORM_ITEM_PROPS,
    }), [EmployeesMessage])
    const employeesSelectProps = useMemo(() => ({
        disabled: !organizationId,
        initialValue: initialEmployees,
        search: searchEmployeeWithSpecializations(intl, organizationId, null),
        onChange: (value) => setShowHintAlert(!isEmpty(value)),
        ...BASE_SELECT_PROPS,
    }), [initialEmployees, intl, organizationId])

    const handleCheckAllEmployeesCheckboxChange = useCallback(() => setShowHintAlert(false), [])

    if (loading) {
        return (
            <Loader fill size='large'/>
        )
    }

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <FormWithAction
                    initialValues={initialFormValues}
                    action={handleFormSubmit}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Form.Item
                                    name='name'
                                    label={PropertyScopeNameMessage}
                                    labelAlign='left'
                                    required
                                    rules={nameValidations}
                                    {...PROPERTY_SCOPE_NAME_FIELD_PROPS}
                                >
                                    <Input disabled={!organizationId} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    checkAllFieldName='hasAllProperties'
                                    checkAllInitialValue={initialValues.hasAllProperties}
                                    selectFormItemProps={propertiesFormItemProps}
                                    selectProps={propertiesSelectProps}
                                    checkBoxOffset={6}
                                    CheckAllMessage={CheckAllPropertiesMessage}
                                    form={form}
                                />
                            </Col>
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    checkAllFieldName='hasAllEmployees'
                                    checkAllInitialValue={initialValues.hasAllEmployees}
                                    selectFormItemProps={employeesFormItemProps}
                                    selectProps={employeesSelectProps}
                                    checkBoxOffset={6}
                                    CheckAllMessage={CheckAllEmployeesMessage}
                                    form={form}
                                    onCheckBoxChange={handleCheckAllEmployeesCheckboxChange}
                                />
                            </Col>
                            {
                                showHintAlert && (
                                    <Col offset={6} span={12}>
                                        <FormHintAlert />
                                    </Col>
                                )
                            }
                            {children({ handleSave, isLoading, form })}
                        </Row>
                    )}
                </FormWithAction>
            </Col>
        </Row>
    )
}
