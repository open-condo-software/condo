import { Col, Form, Input, Row, Space, Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { OrganizationEmployee, OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { EmployeeRoleSelect } from '../EmployeeRoleSelect'
import { Rule } from 'rc-field-form/lib/interface'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

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

export const EmployeeProfileForm = () => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const EmployeeUpdateTitle = intl.formatMessage({ id: 'profile.Employee.Update' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const { query, push } = useRouter()
    const { organization } = useOrganization()

    const { obj: employee, loading: employeeLoading, error: employeeError, refetch } = OrganizationEmployee.useObject({ where: { id: String(get(query, 'id', '')) } })
    const { objs: employeeRoles, loading: employeeRoleLoading, error: employeeRoleError } = OrganizationEmployeeRole.useObjects(
        { where: { organization: { id: get(organization, 'id') } } }
    )

    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, (data) => {
        refetch().then(() => {
            push(`/employee/${get(query, 'id')}/`)
        })
    })
    const { emailValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        email: [emailValidator],
    }

    if (employeeError || employeeRoleLoading || employeeError || employeeRoleError) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={employeeLoading || employeeRoleLoading} error={(employeeError || employeeRoleLoading) ? ErrorMessage : null}/>
    }

    const formAction = (formValues) => {
        return updateEmployeeAction(formValues, employee)
    }

    const initialValues = {
        role: get(employee, ['role', 'id']),
        position: get(employee, 'position'),
        email: get(employee, 'email'),
    }

    return (
        <FormWithAction
            action={formAction}
            initialValues={initialValues}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values) => {
                const isRoleDeleted = !values.role && initialValues.role

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

