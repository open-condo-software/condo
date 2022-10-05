/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { Card, Col, Form, Row, Space, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from '@open-condo/next/intl'
import { useApolloClient } from '@open-condo/next/apollo'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { OrganizationEmployee, OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { useAuth } from '@open-condo/next/auth'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { SpecializationScope } from '@condo/domains/scope/utils/clientSchema'
import { EmployeeRoleSelect } from '../EmployeeRoleSelect'
import { Loader } from '@condo/domains/common/components/Loader'
import { Rule } from 'rc-field-form/lib/interface'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import {
    ClassifiersQueryRemote,
    TicketClassifierTypes,
} from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import { difference, find, get } from 'lodash'
import { colors, shadows } from '@condo/domains/common/constants/style'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'

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
const CardCss = css`
  width: 300px;
  height: fit-content;
  box-shadow: ${shadows.elevated};
`

export const UpdateEmployeeForm = () => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const EmployeeUpdateTitle = intl.formatMessage({ id: 'profile.Employee.Update' })
    const RoleLabel = intl.formatMessage({ id: 'employee.Role' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const ExampleEmailMsg = intl.formatMessage({ id: 'example.Email' })
    const SpecializationsLabel = intl.formatMessage({ id: 'employee.Specializations' })
    const PositionLabel = intl.formatMessage({ id: 'employee.Position' })
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.UpdateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const CheckAllMessage = intl.formatMessage({ id: 'CheckAll' })

    const { query, push } = useRouter()
    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())
    const { isSmall } = useLayoutContext()

    const employeeId = String(get(query, 'id', ''))
    const { obj: employee, loading: employeeLoading, error: employeeError } = OrganizationEmployee.useObject({ where: { id: employeeId } })
    const { objs: employeeRoles, loading: employeeRolesLoading, error: employeeRolesError } = OrganizationEmployeeRole.useObjects({ where: { organization: { id:  get(employee, ['organization', 'id']) } } })
    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => Promise.resolve())
    const { objs: specializationScopes } = SpecializationScope.useObjects({
        where: {
            employee: { id: employeeId },
        },
    })
    const createSpecializationScopeAction = SpecializationScope.useCreate({}, () => Promise.resolve())
    const updateSpecializationScopeAction = SpecializationScope.useUpdate({}, () => Promise.resolve())
    const initialSpecializations = specializationScopes.map(scope => scope.specialization)

    const { emailValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
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

    const initialValues = {
        role: get(employee, ['role', 'id']),
        position: get(employee, 'position'),
        email: get(employee, 'email'),
        specializations: initialSpecializations.map(spec => spec.id),
        hasAllSpecializations: get(employee, 'hasAllSpecializations'),
    }

    const formAction = useCallback(async (formValues) => {
        const { specializations, ...updateEmployeeFormValues } = formValues
        const initialSpecializationIds = initialSpecializations.map(spec => spec.id)

        const deletedSpecializations = difference(initialSpecializationIds, specializations)
        const newSpecializations = difference(specializations, initialSpecializationIds)

        const specializationScopesToDelete = specializationScopes
            .filter(scope => deletedSpecializations.includes(scope.specialization.id))
        for (const specializationScopeToDelete of specializationScopesToDelete) {
            await updateSpecializationScopeAction({
                deletedAt: 'true',
            }, specializationScopeToDelete)
        }

        for (const newSpecialization of newSpecializations) {
            await createSpecializationScopeAction({
                employee: { connect: { id: employeeId } },
                specialization: { connect: { id: newSpecialization } },
            })
        }

        await updateEmployeeAction(OrganizationEmployee.formValuesProcessor(updateEmployeeFormValues), employee)

        await push(`/employee/${employeeId}/`)
    }, [createSpecializationScopeAction, employee, employeeId, initialSpecializations, push, specializationScopes,
        updateEmployeeAction, updateSpecializationScopeAction])

    const error = employeeError || employeeRolesError
    const loading = employeeLoading || employeeRolesLoading

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
            {({ handleSave, isLoading }) => {
                return (
                    <Row gutter={[0, 40]} justify='center'>
                        <Col xs={10} lg={2}>
                            <UserAvatar borderRadius={24} isBlocked={get(employee, 'isBlocked')}/>
                        </Col>
                        <Col xs={24} lg={12} offset={1}>
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
                                <Col span={24}>
                                    <Form.Item noStyle dependencies={['role']}>
                                        {
                                            ({ getFieldValue })=> {
                                                const role = getFieldValue('role')
                                                const selectedRole = find(employeeRoles, { id: role })

                                                if (get(selectedRole, 'canBeAssignedAsExecutor'))
                                                    return (<Col span={24}>
                                                        <GraphQlSearchInputWithCheckAll
                                                            checkAllFieldName='hasAllSpecializations'
                                                            checkAllInitialValue={initialValues.hasAllSpecializations}
                                                            selectFormItemProps={{
                                                                name: 'specializations',
                                                                label: SpecializationsLabel,
                                                                labelAlign: 'left',
                                                                validateFirst: true,
                                                                ...INPUT_LAYOUT_PROPS,
                                                            }}
                                                            selectProps={{
                                                                search: searchClassifers,
                                                            }}
                                                            CheckAllMessage={CheckAllMessage}
                                                        />
                                                    </Col>)
                                            }
                                        }
                                    </Form.Item>
                                    <Space size={40} style={{ paddingTop: '36px' }}>
                                        <FormResetButton
                                            type='sberPrimary'
                                            secondary
                                        />
                                        <Button
                                            key='submit'
                                            onClick={handleSave}
                                            type='sberPrimary'
                                            loading={isLoading}
                                        >
                                            {ApplyChangesMessage}
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Col>
                        {!isSmall && (
                            <Col lg={9}>
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
                )
            }}
        </FormWithAction>
    )
}

