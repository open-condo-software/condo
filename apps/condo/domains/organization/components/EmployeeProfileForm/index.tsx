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
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { EmployeeRoleSelect } from './EmployeeRoleSelect'
import { Loader } from '@condo/domains/common/components/Loader'
import { Rule } from 'rc-field-form/lib/interface'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ClassifiersQueryRemote, TicketClassifierTypes } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { get } from 'lodash'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'

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
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const TechnicianRoleName = intl.formatMessage({ id: 'employee.role.Technician.name' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const { query, push } = useRouter()
    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())

    const [selectedRole, setSelectedRole] = useState<string>()
    const selectedRoleRef = useRef<string>()

    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useObject({ where: { id: String(get(query, 'id', '')) } }, {
        onCompleted: ()=> {
            setSelectedRole(employee.role.name)
        },
    })
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
        classifiersLoader.search(input, TicketClassifierTypes.category)
            .then(result => result.map((classifier)=> ({ text: classifier.name, value: classifier.id })))

    useEffect(()=> {
        classifiersLoader.init()
        return () => classifiersLoader.clear()
    }, [])   

    useEffect(()=> {
        selectedRoleRef.current = selectedRole
    }, [selectedRole])

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
                const specializations = values.specializations
        
                if (isRoleDeleted) {
                    values.role = null
                }
                if (specializations && specializations.length && selectedRoleRef.current === TechnicianRoleName) {
                    values.specializations = { connect: specializations.map(id => ({ id })) }
                }
                else values.specializations = { disconnectAll: true }
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
                                        <EmployeeRoleSelect employee={employee} onSelect={(_, option) => setSelectedRole(option.title)} />
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

