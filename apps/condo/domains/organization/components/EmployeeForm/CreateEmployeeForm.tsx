import { Col, Form, Row } from 'antd'
import find from 'lodash/find'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { EmployeeRoleSelect } from '@condo/domains/organization/components/EmployeeRoleSelect'
import {
    OrganizationEmployeeRole,
    useInviteNewOrganizationEmployee,
} from '@condo/domains/organization/utils/clientSchema'
import {
    ClassifiersQueryRemote,
    TicketClassifierTypes,
} from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { PHONE_TYPE, EMAIL_TYPE } from '@condo/domains/user/constants/identifiers'

import type { FormRule as Rule } from 'antd'


const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 14,
    },
}

const { publicRuntimeConfig: { inviteRequiredFields } } = getConfig()

const isPhoneRequired = inviteRequiredFields.includes(PHONE_TYPE)
const isEmailRequired = inviteRequiredFields.includes(EMAIL_TYPE)

export const CreateEmployeeForm: React.FC = () => {
    const intl = useIntl()

    const InviteEmployeeLabel = intl.formatMessage({ id: 'employee.InviteEmployee' })
    const FullNameLabel = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const FullNamePlaceholder = intl.formatMessage({ id: 'field.FullName' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'employee.FullName.requiredError' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const EmailLabel = intl.formatMessage({ id: 'Email' })
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const CheckAllMessage = intl.formatMessage({ id: 'CheckAll' })

    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())
    const { organization } = useOrganization()
    const router = useRouter()
    const { breakpoints } = useLayoutContext()

    const organizationId = get(organization, 'id', null)

    const { objs: employeeRoles, loading, error } = OrganizationEmployeeRole.useObjects(
        { where: { organization: { id: organizationId } } }
    )

    const { changeMessage, requiredValidator, emailValidator, phoneValidator, trimValidator, specCharValidator } = useValidations()

    const validations: { [key: string]: Rule[] } = {
        phone: [
            ...(isPhoneRequired ? [requiredValidator] : []),
            phoneValidator,
        ],
        email: [
            ...(isEmailRequired ? [requiredValidator] : []),
            emailValidator,
        ],
        name: [
            changeMessage(trimValidator, FullNameRequiredMessage),
            changeMessage(specCharValidator, FullNameInvalidCharMessage),
        ],
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

    const specializationsFormItemProps = useMemo(() => ({
        name: 'specializations',
        label: SpecializationsLabel,
        validateFirst: true,
        ...INPUT_LAYOUT_PROPS,
    }), [SpecializationsLabel])

    const specializationsSelectProps = useMemo(() => ({
        search: searchClassifers,
    }), [searchClassifers])

    if (loading || error)
        return <LoadingOrErrorPage title={InviteEmployeeLabel} loading={loading} error={error ? ServerErrorMsg : null} />

    const initialValues = {
        role: get(employeeRoles, [0, 'id'], ''),
        hasAllSpecializations: true,
    }

    return (
        <FormWithAction
            action={action}
            initialValues={initialValues}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            formValuesToMutationDataPreprocessor={(values) => {
                // TODO(Dimitree): delete after useInviteNewOrganizationEmployee move to OrganizationEmployee
                const role = get(values, 'role')
                const specializations = get(values, 'specializations')

                if (specializations) {
                    values.specializations = specializations.map(specId => ({ id: specId }))
                }

                if (role) {
                    values.role = { id: String(role) }
                }
                return values
            }}
        >
            {
                ({ handleSave, isLoading, form }) => {
                    return (
                        <>
                            <Row>
                                <Col md={14} xs={24}>
                                    <Row gutter={[0, 60]}>
                                        <Col span={24}>
                                            <Row gutter={[0, 40]}>
                                                <Col span={24}>
                                                    <Form.Item name='role' label={RoleLabel} {...INPUT_LAYOUT_PROPS} labelAlign='left' >
                                                        <EmployeeRoleSelect
                                                            employeeRoles={employeeRoles}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name='name'
                                                        label={FullNameLabel}
                                                        {...INPUT_LAYOUT_PROPS}
                                                        labelAlign='left'
                                                        required
                                                        validateFirst
                                                        rules={validations.name}
                                                    >
                                                        <Input placeholder={FullNamePlaceholder} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item name='position' label={PositionLabel} {...INPUT_LAYOUT_PROPS} labelAlign='left'>
                                                        <Input />
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
                                                                        <GraphQlSearchInputWithCheckAll
                                                                            checkAllFieldName='hasAllSpecializations'
                                                                            checkAllInitialValue={true}
                                                                            selectFormItemProps={specializationsFormItemProps}
                                                                            selectProps={specializationsSelectProps}
                                                                            CheckAllMessage={CheckAllMessage}
                                                                            checkBoxOffset={8}
                                                                            form={form}
                                                                        />
                                                                    </Col>
                                                                )
                                                            )
                                                        }
                                                    }
                                                </Form.Item>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name='phone'
                                                        label={PhoneLabel}
                                                        labelAlign='left'
                                                        required={isPhoneRequired}
                                                        validateFirst
                                                        rules={validations.phone}
                                                        {...INPUT_LAYOUT_PROPS}
                                                    >
                                                        <PhoneInput placeholder={ExamplePhoneMsg} block />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name='email'
                                                        label={EmailLabel}
                                                        labelAlign='left'
                                                        required={isEmailRequired}
                                                        validateFirst
                                                        rules={validations.email}
                                                        {...INPUT_LAYOUT_PROPS}
                                                    >
                                                        <Input placeholder={ExampleEmailMsg}/>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item noStyle dependencies={['phone', 'email']}>
                                                {
                                                    ({ getFieldsValue }) => {
                                                        const { phone, email } = getFieldsValue(['phone', 'email'])
                                                        const isDisabled = (isPhoneRequired && !phone) || (isEmailRequired && !email)

                                                        return (
                                                            <ActionBar
                                                                actions={[
                                                                    <Button
                                                                        key='submit'
                                                                        onClick={handleSave}
                                                                        type='primary'
                                                                        loading={isLoading}
                                                                        disabled={isDisabled}
                                                                    >
                                                                        {InviteEmployeeLabel}
                                                                    </Button>,
                                                                ]}
                                                            />
                                                        )
                                                    }
                                                }
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                {breakpoints.TABLET_LARGE && (
                                    <Col span={10}>
                                        <Form.Item dependencies={['role']}>
                                            {({ getFieldValue }) => {
                                                const roleId = getFieldValue('role')
                                                const role = employeeRoles.find(x => x.id === roleId)
                                                if (!role || !role.description) return null
                                                return (
                                                    <Alert
                                                        type='info'
                                                        showIcon
                                                        message={intl.formatMessage({ id: 'employee.Role.whoIs' }, { roleName: role.name.toLowerCase() })}
                                                        description={role.description}
                                                    />
                                                )
                                            }}
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>
                        </>
                    )
                }
            }
        </FormWithAction>
    )
}
