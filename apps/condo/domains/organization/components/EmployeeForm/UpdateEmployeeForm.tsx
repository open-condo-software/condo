import { Col, Form, Input, Row, Space, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { useApolloClient } from '@core/next/apollo'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { OrganizationEmployee, OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { EmployeeRoleSelect } from '../EmployeeRoleSelect'
import { Loader } from '@condo/domains/common/components/Loader'
import { Rule } from 'rc-field-form/lib/interface'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import {
    ClassifiersQueryRemote,
    TicketClassifierTypes,
} from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { find, get } from 'lodash'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 11,
    },
    wrapperCol: {
        span: 13,
    },
    style: {
        maxWidth: '453px',
    },
}

export const UpdateEmployeeForm = () => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const EmployeeUpdateTitle = intl.formatMessage({ id: 'profile.Employee.Update' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const TechnicianRoleName = intl.formatMessage({ id: 'employee.role.Technician.name' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const { query, push } = useRouter()
    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())

    const { obj: employee, loading: employeeLoading, error: employeeError, refetch } = OrganizationEmployee.useObject({ where: { id: String(get(query, 'id', '')) } })
    const { objs: employeeRoles, loading: employeeRolesLoading, error: employeeRolesError } = OrganizationEmployeeRole.useObjects({ where: { organization: { id:  get(employee, ['organization', 'id']) } } })
    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => {
        refetch().then(() => {
            push(`/employee/${get(query, 'id')}/`)
        })
    })
    const { emailValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        email: [emailValidator],
    }


    const searchClassifers = (_, input) =>
        // We need to load all classifier items to have them pre-selected if a user have some classifier items,
        // that are out of range, queried by ClassifiersQueryRemote with default variables
        classifiersLoader.search(input, TicketClassifierTypes.category, { first: undefined })
            .then(result => result.map((classifier)=> ({ text: classifier.name, value: classifier.id })))

    useEffect(()=> {
        classifiersLoader.init()
        return () => classifiersLoader.clear()
    }, [])   

    const error = employeeError || employeeRolesError
    const loading = employeeLoading || employeeRolesLoading

    if (error) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (loading) {
        return <Loader />
    }
    const formAction = (formValues) => {
        return updateEmployeeAction(formValues, employee)
    }

    const initialValues = {
        role: get(employee, ['role', 'id']),
        position: get(employee, 'position'),
        email: get(employee, 'email'),
        specializations: employee.specializations.map(spec => spec.id),
    }

    return (
        <FormWithAction
            action={formAction}
            initialValues={initialValues}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values)=> {
                const isRoleDeleted = !values.role && initialValues.role
                const role = values.role
                const selectedRole = find(employeeRoles, { id: role })
                if (selectedRole.name !== TechnicianRoleName) {
                    values.specializations = null
                }
                if (isRoleDeleted) {
                    values.role = null
                }
                return values
            }}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Row>
                        <Col span={3}>
                            <UserAvatar borderRadius={24} isBlocked={get(employee, 'isBlocked')}/>
                        </Col>
                        <Col span={20} push={1}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Typography.Title
                                        level={1}
                                        style={{ margin: 0, fontWeight: 'bold' }}
                                    >
                                        {EmployeeUpdateTitle}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'role'}
                                        label={RoleLabel}
                                    >
                                        <EmployeeRoleSelect employeeRoles={employeeRoles} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'position'}
                                        label={PositionLabel}
                                    >
                                        <Input/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'email'}
                                        label={EmailLabel}
                                        validateFirst
                                        rules={validations.email}
                                    >
                                        <Input placeholder={ExampleEmailMsg}/>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    {hasFeature('division') && (
                                        <Form.Item noStyle dependencies={['role']}>
                                            {
                                                ({ getFieldValue })=> {
                                                    const role = getFieldValue('role')
                                                    const selectedRole = find(employeeRoles, { id: role })

                                                    if (selectedRole.name === TechnicianRoleName)
                                                        return (<Col span={24}>
                                                            <Form.Item
                                                                name={'specializations'}
                                                                label={SpecializationsLabel}
                                                                labelAlign={'left'}
                                                                required
                                                                validateFirst
                                                                {...INPUT_LAYOUT_PROPS}
                                                            >
                                                                <GraphQlSearchInput mode="multiple" search={searchClassifers} />
                                                            </Form.Item>
                                                        </Col>)
                                                }
                                            }
                                        </Form.Item>
                                    )}
                                    <Space size={40} style={{ paddingTop: '36px' }}>
                                        <FormResetButton
                                            type={'sberPrimary'}
                                            secondary
                                        />
                                        <Button
                                            key={'submit'}
                                            onClick={handleSave}
                                            type={'sberPrimary'}
                                            loading={isLoading}
                                        >
                                            {ApplyChangesMessage}
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )
            }}
        </FormWithAction>
    )
}

