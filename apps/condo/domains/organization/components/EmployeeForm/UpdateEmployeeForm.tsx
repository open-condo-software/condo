import { Col, Form, Row, Typography } from 'antd'
import { difference, find, get } from 'lodash'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Alert, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import Prompt from '@condo/domains/common/components/Prompt'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { EmployeeRoleSelect } from '@condo/domains/organization/components/EmployeeRoleSelect'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployee, OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import {
    ClassifiersQueryRemote,
    TicketClassifierTypes,
} from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
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

const isPhoneEditable = !inviteRequiredFields.includes(PHONE_TYPE)
const isEmailEditable = !inviteRequiredFields.includes(EMAIL_TYPE)

export const UpdateEmployeeForm: React.FC = () => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const CheckAllMessage = intl.formatMessage({ id: 'CheckAll' })
    const PromptTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'form.prompt.message' })

    const { query, push } = useRouter()
    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())
    const { breakpoints } = useLayoutContext()

    const employeeId = String(get(query, 'id', ''))
    const { obj: employee, loading: employeeLoading, error: employeeError } = OrganizationEmployee.useObject({ where: { id: employeeId } })
    const { objs: employeeRoles, loading: employeeRolesLoading, error: employeeRolesError } = OrganizationEmployeeRole.useObjects({ where: { organization: { id:  get(employee, ['organization', 'id']) } } })
    const updateEmployeeAction = OrganizationEmployee.useUpdate({})
    const { objs: organizationEmployeeSpecializations } = OrganizationEmployeeSpecialization.useObjects({
        where: {
            employee: { id: employeeId },
        },
    })
    const createOrganizationEmployeeSpecializationAction = OrganizationEmployeeSpecialization.useCreate({})
    const updateOrganizationEmployeeSpecializationAction = OrganizationEmployeeSpecialization.useUpdate({})
    const initialSpecializations = useMemo(() => organizationEmployeeSpecializations.map(scope => scope.specialization),
        [organizationEmployeeSpecializations])

    const { emailValidator, phoneValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        phone: [phoneValidator],
        email: [emailValidator],
    }

    const { user } = useAuth()
    const userId = get(user, 'id')
    const employeeUserId = get(employee, 'user.id')
    const isMyEmployee = userId && employeeUserId && userId === employeeUserId

    const searchClassifers = (_, input) =>
        // We need to load all classifier items to have them pre-selected if a user have some classifier items,
        // that are out of range, queried by ClassifiersQueryRemote with default variables
        classifiersLoader.search(input, TicketClassifierTypes.category, { first: undefined })
            .then(result => result.map((classifier)=> ({ text: classifier.name, value: classifier.id })))

    useEffect(()=> {
        classifiersLoader.init()
        return () => classifiersLoader.clear()
    }, [])

    const initialValues = useMemo(() => ({
        role: get(employee, ['role', 'id']),
        position: get(employee, 'position'),
        email: get(employee, 'email'),
        specializations: initialSpecializations.map(spec => spec.id),
        hasAllSpecializations: get(employee, 'hasAllSpecializations'),
    }), [employee, initialSpecializations])

    const onCancel = useCallback(() => {
        push(`/employee/${employeeId}`)
    }, [employeeId, push])

    const formAction = useCallback(async (formValues) => {
        const { specializations, ...updateEmployeeFormValues } = formValues
        const initialSpecializationIds = initialSpecializations.map(spec => spec.id)

        const deletedSpecializations = difference(initialSpecializationIds, specializations)
        const newSpecializations = difference(specializations, initialSpecializationIds)

        const organizationEmployeeSpecializationsToDelete = organizationEmployeeSpecializations
            .filter(scope => deletedSpecializations.includes(scope.specialization.id))
        for (const organizationEmployeeSpecializationToDelete of organizationEmployeeSpecializationsToDelete) {
            await updateOrganizationEmployeeSpecializationAction({
                deletedAt: 'true',
            }, organizationEmployeeSpecializationToDelete)
        }

        for (const newSpecialization of newSpecializations) {
            await createOrganizationEmployeeSpecializationAction({
                employee: { connect: { id: employeeId } },
                specialization: { connect: { id: newSpecialization } },
            })
        }

        await updateEmployeeAction(OrganizationEmployee.formValuesProcessor(updateEmployeeFormValues), employee)

        await push(`/employee/${employeeId}`)
    }, [createOrganizationEmployeeSpecializationAction, employee, employeeId, initialSpecializations, push, organizationEmployeeSpecializations,
        updateEmployeeAction, updateOrganizationEmployeeSpecializationAction])

    const error = employeeError || employeeRolesError
    const loading = employeeLoading || employeeRolesLoading

    const specializationsFormItemProps = {
        name: 'specializations',
        label: SpecializationsLabel,
        validateFirst: true,
        ...INPUT_LAYOUT_PROPS,
    }

    const specializationsSelectProps = {
        search: searchClassifers,
    }

    if (error) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (loading) {
        return <Loader />
    }

    return (
        <FormWithAction
            action={formAction}
            initialValues={initialValues}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            formValuesToMutationDataPreprocessor={(values)=> {
                const isRoleDeleted = !values.role && initialValues.role

                if (isRoleDeleted) {
                    values.role = null
                }

                if (isRoleDeleted) {
                    values.role = null
                }

                return values
            }}
        >
            {({ handleSave, isLoading, form }) => {
                return (
                    <>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        <Row gutter={[0, 40]}>
                            <Col xs={10} lg={2}>
                                <UserAvatar borderRadius={24} isBlocked={get(employee, 'isBlocked')}/>
                            </Col>
                            <Col xs={24} lg={12} offset={1}>
                                <Row gutter={[0, 60]}>
                                    <Col>
                                        <Row gutter={[0, 40]}>
                                            <Col span={24}>
                                                <Form.Item
                                                    {...INPUT_LAYOUT_PROPS}
                                                    labelAlign='left'
                                                    name='role'
                                                    label={RoleLabel}
                                                >
                                                    <EmployeeRoleSelect employeeRoles={employeeRoles} disabled={isMyEmployee} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item
                                                    {...INPUT_LAYOUT_PROPS}
                                                    labelAlign='left'
                                                    name='position'
                                                    label={PositionLabel}
                                                >
                                                    <Input/>
                                                </Form.Item>
                                            </Col>
                                            {
                                                isPhoneEditable &&
                                                <Col span={24}>
                                                    <Form.Item
                                                        {...INPUT_LAYOUT_PROPS}
                                                        labelAlign='left'
                                                        name='phone'
                                                        label={PhoneLabel}
                                                        validateFirst
                                                        rules={validations.phone}
                                                    >
                                                        <PhoneInput placeholder={ExamplePhoneMsg} block />
                                                    </Form.Item>
                                                </Col>
                                            }
                                            {
                                                isEmailEditable &&
                                                <Col span={24}>
                                                    <Form.Item
                                                        {...INPUT_LAYOUT_PROPS}
                                                        labelAlign='left'
                                                        name='email'
                                                        label={EmailLabel}
                                                        validateFirst
                                                        rules={validations.email}
                                                    >
                                                        <Input placeholder={ExampleEmailMsg}/>
                                                    </Form.Item>
                                                </Col>
                                            }
                                            <Col span={24}>
                                                <Form.Item noStyle dependencies={['role']}>
                                                    {
                                                        ({ getFieldValue })=> {
                                                            const role = getFieldValue('role')
                                                            const selectedRole = find(employeeRoles, { id: role })

                                                            if (get(selectedRole, 'canBeAssignedAsExecutor'))
                                                                return (
                                                                    <Col span={24}>
                                                                        <GraphQlSearchInputWithCheckAll
                                                                            checkAllFieldName='hasAllSpecializations'
                                                                            checkAllInitialValue={initialValues.hasAllSpecializations}
                                                                            selectFormItemProps={specializationsFormItemProps}
                                                                            selectProps={specializationsSelectProps}
                                                                            CheckAllMessage={CheckAllMessage}
                                                                            checkBoxOffset={8}
                                                                            form={form}
                                                                        />
                                                                    </Col>
                                                                )
                                                        }
                                                    }
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <ActionBar
                                            actions={[
                                                <Button
                                                    key='submit'
                                                    onClick={handleSave}
                                                    type='primary'
                                                    loading={isLoading}
                                                >
                                                    {ApplyChangesMessage}
                                                </Button>,
                                                <Button
                                                    key='cancel'
                                                    type='secondary'
                                                    onClick={onCancel}
                                                >
                                                    {CancelLabel}
                                                </Button>,
                                            ]}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            {breakpoints.TABLET_LARGE && (
                                <Col lg={9}>
                                    <Form.Item dependencies={['role']}>
                                        {({ getFieldValue }) => {
                                            const roleId = getFieldValue('role')
                                            const role = employeeRoles.find(x => x.id === roleId)
                                            if (!role) return null
                                            return (
                                                <Alert
                                                    type='info'
                                                    showIcon
                                                    message={role.name}
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
            }}
        </FormWithAction>
    )
}
