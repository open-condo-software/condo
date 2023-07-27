import { Col, Row, Space, Switch } from 'antd'
import { map } from 'lodash'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import Router from 'next/router'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Edit } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Alert, Button, Tag, Typography } from '@open-condo/ui'

import {
    PageContent,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FieldPairRow as BaseFieldPairRow, FieldPairRowProps } from '@condo/domains/common/components/FieldPairRow'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { EmployeeInviteRetryButton } from '@condo/domains/organization/components/EmployeeInviteRetryButton'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'


const ReInviteActionAlert = ({ employee }) => {
    const intl = useIntl()
    const EmployeeDidntEnteredMessage = intl.formatMessage({ id: 'employee.employeeDidntEntered' })
    const EmployeeRejectedMessage = intl.formatMessage({ id: 'users.status.rejected' })

    const isEmployeeRejected = get(employee, 'isRejected')

    if (isEmployeeRejected) {
        return (
            <Alert showIcon type='warning' message={EmployeeRejectedMessage}/>
        )
    }

    return (
        <Alert showIcon type='warning' message={
            <>
                {EmployeeDidntEnteredMessage}&nbsp;
                <EmployeeInviteRetryButton employee={employee}/>
            </>
        } />
    )
}

const EMPLOYEE_FIELD_PAIR_PROPS: Partial<FieldPairRowProps> = {
    titleColProps: { lg: 4, xs: 10 },
    valueColProps: { lg: 18, xs: 13, offset: 1 },
}

const FieldPairRow: React.FC<FieldPairRowProps> = (props) => (
    <BaseFieldPairRow
        {...EMPLOYEE_FIELD_PAIR_PROPS}
        {...props}
    />
)

export const EmployeePageContent = ({
    employee,
    isEmployeeEditable,
    isEmployeeReinvitable,
    updateEmployeeAction,
    softDeleteAction,
    phonePrefix = '',
}) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.eMail' })
    const UpdateMessage = intl.formatMessage({ id: 'edit' })
    const RoleMessage = intl.formatMessage({ id: 'employee.role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.position' })
    const SpecializationsMessage = intl.formatMessage({ id: 'employee.specializations' })
    const BlockUserMessage = intl.formatMessage({ id: 'employee.blockUser' })
    const CanNotBlockYourselfMessage = intl.formatMessage({ id: 'employee.canNotBlockYourself' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'employee.confirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'employee.confirmDeleteMessage' })
    const AllSpecializationsMessage = intl.formatMessage({ id: 'employee.allSpecializations' })
    const DeleteMessage = intl.formatMessage({ id: 'delete' })

    const { user } = useAuth()
    const { breakpoints } = useLayoutContext()

    const userId = get(user, 'id')
    const employeeUserId = get(employee, 'user.id')
    const isMyEmployee = userId && employeeUserId && userId === employeeUserId
    const isEmployeeBlocked = get(employee, 'isBlocked')

    const name = get(employee, 'name')
    const phone = get(employee, 'phone')
    const email = get(employee, 'email')
    const hasAllSpecializations = get(employee, 'hasAllSpecializations')

    const renderSpecializations = useCallback((specializations) => (
        <Typography.Text>
            {map(specializations, 'name').join(', ')}
        </Typography.Text>
    ), [])

    const handleEmployeeBlock = useCallback((blocked) => {
        if (!isEmployeeEditable) {
            return
        }

        updateEmployeeAction({ isBlocked: blocked }, employee)
    }, [employee, isEmployeeEditable, updateEmployeeAction])

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} justify='center'>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24} isBlocked={isEmployeeBlocked}/>
                        </Col>
                        <Col xs={24} lg={20} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                            <Row gutter={[0, 60]}>
                                <Col span={24}>
                                    <Row gutter={[0, 40]}>
                                        <Col span={24}>
                                            <Typography.Title
                                                level={1}
                                            >
                                                {name}
                                            </Typography.Title>
                                            <NotDefinedField
                                                showMessage={false}
                                                value={get(employee, ['position'])}
                                                render={(value) => (
                                                    <Typography.Title
                                                        level={2}
                                                    >
                                                        {value}
                                                    </Typography.Title>
                                                )}
                                            />
                                        </Col>
                                        {isEmployeeReinvitable && (
                                            <ReInviteActionAlert employee={employee} />
                                        )}
                                        {isEmployeeEditable && (
                                            <Col span={24}>
                                                <label>
                                                    <Space direction='horizontal' size={8}>
                                                        <Switch
                                                            onChange={handleEmployeeBlock}
                                                            defaultChecked={isEmployeeBlocked}
                                                            disabled={isMyEmployee}
                                                        />
                                                        <Typography.Text type='danger'>
                                                            {BlockUserMessage}
                                                        </Typography.Text>
                                                        {
                                                            (isMyEmployee) ?
                                                                <Typography.Text>
                                                                    {CanNotBlockYourselfMessage}
                                                                </Typography.Text>
                                                                :
                                                                null
                                                        }
                                                    </Space>
                                                </label>
                                            </Col>
                                        )}
                                        <Col span={24}>
                                            <FrontLayerContainer showLayer={isEmployeeBlocked}>
                                                <Row gutter={[0, 24]}>
                                                    <FieldPairRow
                                                        fieldTitle={PhoneMessage}
                                                        fieldValue={phone}
                                                        href={`tel:${phonePrefix ? `${phonePrefix}${phone}` : phone}`}
                                                    />
                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {RoleMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, ['role', 'name'])}
                                                            render={
                                                                (roleName: string) => (
                                                                    <Tag color='default'>{roleName}</Tag>
                                                                )
                                                            }
                                                        />
                                                    </Col>

                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {PositionMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        <NotDefinedField
                                                            value={get(employee, 'position')}
                                                            render={
                                                                (value: string) => (
                                                                    <Tag color='default'>{value}</Tag>
                                                                )
                                                            }
                                                        />
                                                    </Col>

                                                    <Col lg={4} xs={10}>
                                                        <Typography.Text type='secondary'>
                                                            {SpecializationsMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col lg={18} xs={13} offset={1}>
                                                        {
                                                            hasAllSpecializations ? AllSpecializationsMessage : (
                                                                <NotDefinedField
                                                                    value={get(employee, 'specializations')}
                                                                    render={renderSpecializations}
                                                                />
                                                            )
                                                        }
                                                    </Col>

                                                    {
                                                        email && <FieldPairRow
                                                            fieldTitle={EmailMessage}
                                                            fieldValue={email}
                                                            href={`mailto:${email}`}
                                                        />
                                                    }
                                                </Row>
                                            </FrontLayerContainer>
                                        </Col>
                                        {isEmployeeEditable && (
                                            <Col span={24}>
                                                <ActionBar
                                                    actions={[
                                                        <Link key='update' href={`/employee/${get(employee, 'id')}/update`}>
                                                            <Button
                                                                type='primary'
                                                                icon={<Edit size='medium'/>}
                                                            >
                                                                {UpdateMessage}
                                                            </Button>
                                                        </Link>,
                                                        !isMyEmployee &&
                                                            <DeleteButtonWithConfirmModal
                                                                key='delete'
                                                                title={ConfirmDeleteTitle}
                                                                message={ConfirmDeleteMessage}
                                                                okButtonLabel={ConfirmDeleteButtonLabel}
                                                                action={() => softDeleteAction(employee)}
                                                                buttonContent={DeleteMessage}
                                                            />,
                                                    ]}
                                                />
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export const EmployeeInfoPage = () => {
    const { query } = useRouter()
    const { link } = useOrganization()
    const intl = useIntl()
    const UpdateEmployeeMessage = intl.formatMessage({ id: 'employee.updateTitle' })
    const ErrorMessage = intl.formatMessage({ id: 'errors.loadingError' })

    const employeeId = String(get(query, 'id', ''))
    const { obj: employee, loading, error, refetch } = OrganizationEmployee.useObject(
        {
            where: {
                id: employeeId,
            },
        }
    )
    const { objs: organizationEmployeeSpecializations } = OrganizationEmployeeSpecialization.useObjects({
        where: {
            employee: { id: employeeId },
        },
    })

    const employeeWithSpecializations = { ...employee, specializations: organizationEmployeeSpecializations.map(scope => scope.specialization) }

    const updateEmployeeAction = OrganizationEmployee.useUpdate({}, () => refetch())
    const softDeleteAction = OrganizationEmployee.useSoftDelete(() => Router.push('/employee/'))

    const isEmployeeEditable = get(link, ['role', 'canInviteNewOrganizationEmployees'], null)
    const isEmployeeReinvitable = get(link, ['role', 'canManageEmployees'], null) && !get(employee, 'isAccepted')

    if (error || loading) {
        return <LoadingOrErrorPage title={UpdateEmployeeMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }

    return (
        <EmployeePageContent
            employee={employeeWithSpecializations}
            updateEmployeeAction={updateEmployeeAction}
            softDeleteAction={softDeleteAction}
            isEmployeeEditable={isEmployeeEditable}
            isEmployeeReinvitable={isEmployeeReinvitable}
        />
    )
}

EmployeeInfoPage.requiredAccess = OrganizationRequired

export default EmployeeInfoPage
