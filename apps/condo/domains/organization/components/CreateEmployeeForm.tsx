import { Col, Form, Input, Row } from 'antd'
import MaskedInput from 'antd-mask-input'
import { Rule } from 'rc-field-form/lib/interface'
import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { Button } from '@condo/domains/common/components/Button'
import { useInviteNewOrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { ErrorsContainer } from '@condo/domains/organization/components/ErrorsContainer'
import { EmployeeRoleSelect } from './EmployeeRoleSelect'

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

    const validations: { [key: string]: Rule[] } = {
        phone: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Phone.requiredError' }),
            },
            {
                validator: (_, value) => {
                    const phone = value.replace(/\D/g, '')

                    if (phone.length !== 11) {
                        return Promise.reject(new Error(intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })))
                    }

                    return Promise.resolve()
                },
            },
        ],
        email: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.email.requiredError' }),
            },
            {
                type: 'email',
                message: intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' }),
            },
        ],
    }

    const action = useInviteNewOrganizationEmployee({ organization: { id: organization.id } }, () => {
        router.push('/employee/')
    })

    return (
        <FormWithAction
            action={action}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            formValuesToMutationDataPreprocessor={(values) => {
                const role = get(values, 'role')

                if (role) {
                    values.role = { id: String(role) }
                }

                return values
            }}
        >
            {
                ({ handleSave, isLoading }) => {

                    return (
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
                                            <Input placeholder={FullNamePlaceholder}/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name={'position'} label={PositionLabel} {...INPUT_LAYOUT_PROPS} labelAlign={'left'}>
                                            <Input/>
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
                                            <MaskedInput mask='+1 (111) 111-11-11'/>
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
                                            <Input/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name={'role'} label={RoleLabel} {...INPUT_LAYOUT_PROPS} labelAlign={'left'}>
                                            <EmployeeRoleSelect organizationId={get(organization, 'id')} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item noStyle dependencies={['phone', 'email']}>
                                    {
                                        ({ getFieldsValue }) => {
                                            const { phone, email } = getFieldsValue(['phone', 'email'])

                                            return (
                                                <Row gutter={[0, 24]}>
                                                    <ErrorsContainer phone={phone} email={email}/>
                                                    <Col span={24}>
                                                        <Button
                                                            key='submit'
                                                            onClick={handleSave}
                                                            type='sberPrimary'
                                                            loading={isLoading}
                                                            disabled={!phone}
                                                        >
                                                            {InviteEmployeeLabel}
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            )
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>

                    )
                }
            }
        </FormWithAction>
    )
}
