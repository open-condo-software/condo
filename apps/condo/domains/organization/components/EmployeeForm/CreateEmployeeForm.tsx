/** @jsx jsx */
import { Card, Col, Form, Row } from 'antd'
import Input from '@condo/domains/common/components/Input'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useEffect } from 'react'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { useApolloClient } from '@core/next/apollo'
import { get, find, isEmpty } from 'lodash'
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
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { EmployeeRoleSelect } from '../EmployeeRoleSelect'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { css, jsx } from '@emotion/core'
import { ClassifiersQueryRemote, TicketClassifierTypes } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import ActionBar from '@condo/domains/common/components/ActionBar'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'

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
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const FullNamePlaceholder = intl.formatMessage({ id: 'field.FullName' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'employee.FullName.requiredError' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const EmailLabel = intl.formatMessage({ id: 'Email' })
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const PhoneIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const UserAlreadyInListMsg = intl.formatMessage({ id: 'pages.users.UserIsAlreadyInList' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())
    const { organization } = useOrganization()
    const router = useRouter()
    const { isSmall } = useLayoutContext()

    const { objs: employee } = OrganizationEmployee.useObjects(
        { where: { organization: { id: organization.id } } },
        { fetchPolicy: 'network-only' },
    )

    const { objs: employeeRoles, loading, error } = OrganizationEmployeeRole.useObjects(
        { where: { organization: { id: get(organization, 'id') } } }
    )

    const { changeMessage, requiredValidator, emailValidator, phoneValidator } = useValidations()
    const alreadyRegisteredPhoneValidator = {
        validator: (_, value) => {
            if (employee.find(emp => emp.phone === value)) return Promise.reject(UserAlreadyInListMsg)
            const v = normalizePhone(value)
            if (!v) return Promise.reject(PhoneIsNotValidMsg)
            return Promise.resolve()
        },
    }
    const alreadyRegisteredEmailValidator = {
        validator: (_, value) => {
            if (isEmpty(value)) {
                return  Promise.resolve()
            }
            if (employee.find(emp => emp.email === value)) return Promise.reject(UserAlreadyInListMsg)
            return Promise.resolve()
        },
    }

    const validations: { [key: string]: Rule[] } = {
        phone: [requiredValidator, phoneValidator, alreadyRegisteredPhoneValidator],
        email: [emailValidator, alreadyRegisteredEmailValidator],
        name: [changeMessage(requiredValidator, FullNameRequiredMessage)],
    }

    const action = useInviteNewOrganizationEmployee({ organization: { id: organization.id } }, () => {
        router.push('/employee/')
    })

    const searchClassifers = (_, input) =>
        // When user will try to select classifier items from existing list and will not type search query,
        // not all classifier items will be presented and it will seem to user, like they are missing.
        // Load all of them.
        classifiersLoader.search(input, TicketClassifierTypes.category, { first: undefined })
            .then(result=>result.map((classifier)=> ({ text: classifier.name, value: classifier.id })))

    useEffect(()=> {
        classifiersLoader.init()
        return () => classifiersLoader.clear()
    }, [])

    if (loading || error)
        return <LoadingOrErrorPage title={InviteEmployeeLabel} loading={loading} error={error ? ServerErrorMsg : null} />

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
                const specializations = get(values, 'specializations')

                if (role) {
                    values.role = { id: String(role) }
                }
                if (specializations) {
                    values.specializations = { connect: specializations.map(id => ({ id })) }
                }
                return values
            }}
        >
            {
                ({ handleSave, isLoading }) => {

                    return (
                        <>
                            <Row>
                                <Col lg={14} xs={24}>
                                    <Row gutter={[0, 40]}>
                                        <Col span={24}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Form.Item name={'role'} label={RoleLabel} {...INPUT_LAYOUT_PROPS} labelAlign={'left'} >
                                                        <EmployeeRoleSelect
                                                            employeeRoles={employeeRoles}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name={'name'}
                                                        label={FullNameLabel}
                                                        {...INPUT_LAYOUT_PROPS}
                                                        labelAlign={'left'}
                                                        required
                                                        rules={validations.name}
                                                    >
                                                        <Input placeholder={FullNamePlaceholder} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item name={'position'} label={PositionLabel} {...INPUT_LAYOUT_PROPS} labelAlign={'left'}>
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
                                                        <PhoneInput placeholder={ExamplePhoneMsg} block />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name={'email'}
                                                        label={EmailLabel}
                                                        labelAlign={'left'}
                                                        validateFirst
                                                        rules={validations.email}
                                                        {...INPUT_LAYOUT_PROPS}
                                                    >
                                                        <Input placeholder={ExampleEmailMsg}/>
                                                    </Form.Item>
                                                </Col>
                                                <Form.Item noStyle dependencies={['role']}>
                                                    {
                                                        ({ getFieldsValue }) => {
                                                            const { role } = getFieldsValue(['role'])
                                                            const selectedRole = find(employeeRoles, { id: role })

                                                            return (
                                                                get(selectedRole, 'canBeAssignedAsExecutor') && (
                                                                    <Col span={24}>
                                                                        <Form.Item
                                                                            name={'specializations'}
                                                                            label={SpecializationsLabel}
                                                                            labelAlign={'left'}
                                                                            validateFirst
                                                                            {...INPUT_LAYOUT_PROPS}
                                                                        >
                                                                            <GraphQlSearchInput mode="multiple" search={searchClassifers} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                )
                                                            )
                                                        }
                                                    }
                                                </Form.Item>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                                {!isSmall && (
                                    <Col span={10}>
                                        <Form.Item dependencies={['role']}>
                                            {({ getFieldValue }) => {
                                                const roleId = getFieldValue('role')
                                                const role = employeeRoles.find(x => x.id === roleId)
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
                                )}
                            </Row>
                            <Form.Item noStyle dependencies={['phone']}>
                                {
                                    ({ getFieldsValue }) => {
                                        const { phone } = getFieldsValue(['phone'])
                                        return (
                                            <ActionBar>
                                                <Button
                                                    key='submit'
                                                    onClick={handleSave}
                                                    type='sberPrimary'
                                                    loading={isLoading}
                                                    disabled={!phone}
                                                >
                                                    {InviteEmployeeLabel}
                                                </Button>

                                            </ActionBar>
                                        )
                                    }
                                }
                            </Form.Item>
                        </>
                    )
                }
            }
        </FormWithAction>

    )
}
