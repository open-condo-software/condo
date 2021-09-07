/** @jsx jsx */
import { Card, Col, Form, Input, Row } from 'antd'
import { Rule } from 'rc-field-form/lib/interface'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
const { normalizePhone } = require('@condo/domains/common/utils/phone')
import { Button } from '@condo/domains/common/components/Button'
import {
    OrganizationEmployee,
    OrganizationEmployeeRole,
    useInviteNewOrganizationEmployee,
} from '@condo/domains/organization/utils/clientSchema'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { ErrorsContainer } from '@condo/domains/organization/components/ErrorsContainer'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { EmployeeRoleSelect } from './EmployeeRoleSelect'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { css, jsx } from '@emotion/core'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 14,
    },
    style: {
        paddingBottom: '24px',
    },
}

const CardCss = css`
    width: 300px;
    height: fit-content;
    box-shadow: ${shadows.elevated};
`

export const CreateEmployeeForm: React.FC = () => {
    const intl = useIntl()
    const InviteEmployeeLabel = intl.formatMessage({ id: 'employee.InviteEmployee' })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const router = useRouter()

    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const FullNamePlaceholder = intl.formatMessage({ id: 'field.FullName' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const EmailLabel = intl.formatMessage({ id: 'Email' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const PhoneIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const UserAlreadyInListMsg = intl.formatMessage({ id: 'pages.users.UserIsAlreadyInList' })

    const { objs: employee } = OrganizationEmployee.useObjects(
        { where: { organization: { id: organization.id } } },
        { fetchPolicy: 'network-only' },
    )

    const {
        objs: employeeRoles,
        loading,
        error,
    } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: get(organization, 'id') } } })

    const { requiredValidator, emailValidator, phoneValidator } = useValidations()
    const alreadyRegisteredPhoneValidator = {
        validator: (_, value) => {
            if (employee.find((emp) => emp.phone === value)) return Promise.reject(UserAlreadyInListMsg)
            const v = normalizePhone(value)
            if (!v) return Promise.reject(PhoneIsNotValidMsg)
            return Promise.resolve()
        },
    }
    const alreadyRegisteredEmailValidator = {
        validator: (_, value) => {
            if (employee.find((emp) => emp.email === value)) return Promise.reject(UserAlreadyInListMsg)
            return Promise.resolve()
        },
    }

    const validations: { [key: string]: Rule[] } = {
        phone: [requiredValidator, phoneValidator, alreadyRegisteredPhoneValidator],
        email: [requiredValidator, emailValidator, alreadyRegisteredEmailValidator],
    }

    const action = useInviteNewOrganizationEmployee({ organization: { id: organization.id } }, () => {
        router.push('/employee/')
    })

    const initialValues = {
        role: get(employeeRoles, [0, 'id'], ''),
    }

    return (
        <FormWithAction
            action={action}
            initialValues={initialValues}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            formValuesToMutationDataPreprocessor={(values) => {
                // TODO(Dimitree): delete after useInviteNewOrganizationEmployee move to OrganizationEmployee
                const role = get(values, 'role')

                if (role) {
                    values.role = { id: String(role) }
                }

                return values
            }}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Row>
                        <Col span={14}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row gutter={[0, 24]}>
                                        <Col span={24}>
                                            <Form.Item
                                                name={'name'}
                                                label={FullNameLabel}
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                            >
                                                <Input placeholder={FullNamePlaceholder} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name={'position'}
                                                label={PositionLabel}
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name={'phone'}
                                                label={PhoneLabel}
                                                labelAlign={'left'}
                                                required
                                                validateFirst
                                                rules={validations.phone}
                                                {...INPUT_LAYOUT_PROPS}
                                            >
                                                <PhoneInput placeholder={ExamplePhoneMsg} style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name={'email'}
                                                label={EmailLabel}
                                                labelAlign={'left'}
                                                required
                                                validateFirst
                                                rules={validations.email}
                                                {...INPUT_LAYOUT_PROPS}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item
                                                name={'role'}
                                                label={RoleLabel}
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign={'left'}
                                            >
                                                <EmployeeRoleSelect
                                                    loading={loading}
                                                    error={Boolean(error)}
                                                    employeeRoles={employeeRoles}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Form.Item noStyle dependencies={['phone', 'email']}>
                                        {({ getFieldsValue }) => {
                                            const { phone, email } = getFieldsValue(['phone', 'email'])

                                            return (
                                                <Row gutter={[0, 24]}>
                                                    <ErrorsContainer phone={phone} email={email} />
                                                    <Col span={24}>
                                                        <Button
                                                            key="submit"
                                                            onClick={handleSave}
                                                            type="sberPrimary"
                                                            loading={isLoading}
                                                            disabled={!phone || !email}
                                                        >
                                                            {InviteEmployeeLabel}
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={10}>
                            <Form.Item dependencies={['role']}>
                                {({ getFieldValue }) => {
                                    const roleId = getFieldValue('role')
                                    const role = employeeRoles.find((x) => x.id === roleId)
                                    if (!role) return null
                                    return (
                                        <Card
                                            title={role.name}
                                            bordered={false}
                                            css={CardCss}
                                            headStyle={{
                                                color: colors.lightGrey[10],
                                                fontSize: 24,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {role.description}
                                        </Card>
                                    )
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                )
            }}
        </FormWithAction>
    )
}
