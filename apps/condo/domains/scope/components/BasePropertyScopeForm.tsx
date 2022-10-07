import { jsx } from '@emotion/react'
import { Col, Form, Input, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { difference } from 'lodash'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@condo/next/intl'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    searchEmployee,
    searchOrganizationProperty,
} from '@condo/domains/ticket/utils/clientSchema/search'
import { SETTINGS_TAB_PROPERTY_SCOPE } from '@condo/domains/common/constants/settingsTabs'
import { PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '@condo/domains/scope/utils/clientSchema'
import {
    PropertyScopeOrganizationEmployee as PropertyScopeOrganizationEmployeeType,
    PropertyScopeProperty as PropertyScopePropertyType,
} from '@app/condo/schema'
import { Loader } from '@condo/domains/common/components/Loader'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { searchEmployeeWithSpecializations } from '../../organization/utils/clientSchema/search'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol: {
        sm: 14,
    },
}

const LAYOUT = {
    layout: 'horizontal',
}

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 25]
const APARTMENT_COMPLEX_NAME_FIELD_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol:{
        sm: 8,
    },
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
    const PropertyScopeNameMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.propertyScopeName' })
    const PropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.properties' })
    const EmployeesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.employees' })
    const CheckAllMessage = intl.formatMessage({ id: 'CheckAll' })

    const router = useRouter()

    const createPropertyScopePropertyAction = PropertyScopeProperty.useCreate({})
    const softDeletePropertyScopePropertyAction = PropertyScopeProperty.useSoftDelete()

    const createPropertyScopeEmployeeAction = PropertyScopeOrganizationEmployee.useCreate({})
    const softDeletePropertyScopeEmployeeAction = PropertyScopeOrganizationEmployee.useSoftDelete()

    const { propertyScopeProperties = [], propertyScopeEmployees = [] } = initialValues
    const initialProperties = useMemo(() => propertyScopeProperties.map(propertyScopeProperty => propertyScopeProperty.property.id), [propertyScopeProperties])
    const initialEmployees = useMemo(() => propertyScopeEmployees.map(propertyScopeEmployee => propertyScopeEmployee.employee.id), [propertyScopeEmployees])
    const initialFormValues = { ...initialValues, employees: initialEmployees, properties: initialProperties }

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
                                    {...APARTMENT_COMPLEX_NAME_FIELD_PROPS}
                                >
                                    <Input disabled={!organizationId} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    checkAllFieldName='hasAllProperties'
                                    checkAllInitialValue={initialValues.hasAllProperties}
                                    selectFormItemProps={{
                                        name: 'properties',
                                        label: PropertiesMessage,
                                        labelAlign: 'left',
                                        validateFirst: true,
                                        required: true,
                                        ...INPUT_LAYOUT_PROPS,
                                    }}
                                    selectProps={{
                                        disabled: !organizationId,
                                        initialValue: initialProperties,
                                        search: searchOrganizationProperty(organizationId),
                                        showArrow: false,
                                        mode: 'multiple',
                                        infinityScroll: true,
                                    }}
                                    checkBoxOffset={6}
                                    CheckAllMessage={CheckAllMessage}
                                />
                            </Col>
                            <Col span={24}>
                                <GraphQlSearchInputWithCheckAll
                                    checkAllFieldName='hasAllEmployees'
                                    checkAllInitialValue={initialValues.hasAllProperties}
                                    selectFormItemProps={{
                                        name: 'employees',
                                        label: EmployeesMessage,
                                        labelAlign: 'left',
                                        validateFirst: true,
                                        required: true,
                                        ...INPUT_LAYOUT_PROPS,
                                    }}
                                    selectProps={{
                                        disabled: !organizationId,
                                        initialValue: initialEmployees,
                                        search: searchEmployeeWithSpecializations(intl, organizationId, null),
                                        showArrow: false,
                                        mode: 'multiple',
                                    }}
                                    checkBoxOffset={6}
                                    CheckAllMessage={CheckAllMessage}
                                />
                            </Col>
                            {children({ handleSave, isLoading, form })}
                        </Row>
                    )}
                </FormWithAction>
            </Col>
        </Row>
    )
}
