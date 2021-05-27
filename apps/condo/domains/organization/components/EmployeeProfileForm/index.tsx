import { Col, Form, Input, Row, Space, Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { OrganizationEmployee } from '../../utils/clientSchema'
import { EmployeeRoleSelect } from './EmployeeRoleSelect'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 11,
    },
    wrapperCol: {
        span: 13,
    },
    style: {
        paddingBottom: '24px',
        maxWidth: '453px',
    },
}

export const EmployeeProfileForm = () => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.Update' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })

    const { query } = useRouter()

    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useObject({ where: { id: String(get(query, 'id', '')) } })
    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => refetch())

    if (error) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }

    const formAction = (formValues) => {
        return updateEmployeeAction(formValues, employee)
    }

    const initialValues = {
        role: get(employee, ['role', 'id']),
        position: get(employee, 'position'),
    }

    return (
        <FormWithAction
            action={formAction}
            initialValues={initialValues}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit', 'onChange']}
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
                                        {ProfileUpdateTitle}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'role'}
                                        label={RoleLabel}
                                    >
                                        <EmployeeRoleSelect employee={employee}/>
                                    </Form.Item>
                                    <Form.Item
                                        {...INPUT_LAYOUT_PROPS}
                                        labelAlign={'left'}
                                        name={'position'}
                                        label={PositionLabel}
                                    >
                                        <Input/>
                                    </Form.Item>
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

