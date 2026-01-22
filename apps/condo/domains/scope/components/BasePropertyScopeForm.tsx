import {
    PropertyScopeOrganizationEmployee as PropertyScopeOrganizationEmployeeType,
    PropertyScopeProperty as PropertyScopePropertyType,
} from '@app/condo/schema'
import { Col, Form, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import difference from 'lodash/difference'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { searchEmployeeWithSpecializations } from '@condo/domains/organization/utils/clientSchema/search'
import { MAX_NAME_LENGTH } from '@condo/domains/scope/constants/index'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '@condo/domains/scope/utils/clientSchema'
import {
    searchOrganizationProperty,
} from '@condo/domains/scope/utils/clientSchema/search'
import { convertEmployeesToOptions } from '@condo/domains/scope/utils/clientSchema/utils'

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

export const BasePropertyScopeForm: React.FC<BasePropertyScopeFormProps> = (props) => {
    const intl = useIntl()
    const PropertyScopeNameMessage = intl.formatMessage({ id: 'field.Name' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })
    const CheckAllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllProperties' })
    const CheckAllEmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.chooseAllEmployees' })
    const NameValidationErrorMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.form.validation.name' }, {
        max: MAX_NAME_LENGTH,
    })

    const {
        children,
        action,
        organizationId,
        initialValues = {} as BasePropertyScopeFormProps['initialValues'],
        loading,
    } = props

    const router = useRouter()

    const { breakpoints } = useLayoutContext()

    const { maxLengthValidator, trimValidator } = useValidations()
    const nameValidations = useMemo(() => [trimValidator, maxLengthValidator(MAX_NAME_LENGTH, NameValidationErrorMessage)], [NameValidationErrorMessage, maxLengthValidator, trimValidator])

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

        await router.push('/settings/propertyScope')
    }, [
        action, createPropertyScopeEmployeeAction, createPropertyScopePropertyAction, initialEmployees,
        initialProperties, propertyScopeEmployees, propertyScopeProperties, router, softDeletePropertyScopeEmployeeAction, softDeletePropertyScopePropertyAction,
    ])

    const renderEmployees = useCallback((options, renderOption) => {
        const employees = options.map(option => option.employee)
        const specializations = get(options, [employees.length - 1, 'specializations'], [])

        return convertEmployeesToOptions(intl, renderOption, employees, specializations, 'id')
    }, [intl])

    const propertiesFormItemProps = useMemo(() => ({
        name: 'properties',
        label: PropertiesMessage,
        ...BASE_FORM_ITEM_PROPS,
    }), [PropertiesMessage])
    const propertiesSelectProps = useMemo(() => ({
        initialValue: initialProperties,
        search: searchOrganizationProperty(organizationId),
        disabled: !organizationId,
        eventName: 'PropertyScopeFormSelectProperty',
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
        renderOptions: renderEmployees,
        eventName: 'PropertyScopeFormSelectEmployee',
        ...BASE_SELECT_PROPS,
    }), [initialEmployees, intl, organizationId, renderEmployees])

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
                    colon={false}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={[0, 60]}>
                            <Col span={24}>
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
                                            checkBoxOffset={breakpoints.TABLET_LARGE && 6}
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
                                            checkBoxOffset={breakpoints.TABLET_LARGE && 6}
                                            CheckAllMessage={CheckAllEmployeesMessage}
                                            form={form}
                                            onCheckBoxChange={handleCheckAllEmployeesCheckboxChange}
                                        />
                                    </Col>
                                    {
                                        showHintAlert && (
                                            <Col offset={breakpoints.TABLET_LARGE && 6} span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                                <FormHintAlert />
                                            </Col>
                                        )
                                    }
                                </Row>
                            </Col>
                            <Col span={24}>
                                {children({ handleSave, isLoading, form })}
                            </Col>
                        </Row>
                    )}
                </FormWithAction>
            </Col>
        </Row>
    )
}
